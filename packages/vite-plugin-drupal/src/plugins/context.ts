import type { Options as VueOptions } from '@vitejs/plugin-vue'
import type { InlinePreset } from 'unimport'
import type { UnimportPluginOptions } from 'unimport/unplugin'
import type { Options as ComponentOptions } from 'unplugin-vue-components'
import type { Plugin, ResolvedConfig, UserConfig } from 'vite'
import type { DrupalPickerOptions } from '../devtools/drupal-picker/node/types'
import process from 'node:process'
import { createDefu } from 'defu'
import { builtinPresets } from 'unimport'
import {
  HeadlessUiResolver,
  VueUseComponentsResolver,
  VueUseDirectiveResolver,
} from 'unplugin-vue-components/resolvers'
import LocalComponentResolver from '../importResolver'
import { getDistThemeName, getThemeBasePath, getThemeName } from '../utils'

/**
 * Plugin options.
 *
 * User options are deep-merged into the defaults. Arrays are not merged:
 * a user array replaces the default array (e.g. `breakpoints.multipliers`,
 * `unimport.presets`, `unimport.dirs`, `unimport.imports`,
 * `components.resolvers`). Spread the defaults yourself if you want to extend.
 */
export interface Options {
  /**
   * Origin of the Drupal site. Defaults to `UEBERTOOL_URL`, `DDEV_PRIMARY_URL`
   * or `http://localhost`.
   */
  url?: string
  vue: VueOptions
  unimport: Partial<UnimportPluginOptions>
  components: ComponentOptions
  themePackage?: string
  ce: {
    prefix: string
  }
  breakpoints: {
    multipliers: string[]
  }
  features: {
    /**
     * @deprecated Unused, the copy-static plugin is disabled.
     */
    resetTheme: boolean
    twighmr: boolean
    clearCache: boolean | string
  }
  baseTheme: string | false
  /**
   * Config sync directory, relative to the theme. Without drush, dev reads
   * whether uebertool_cascade_layer is enabled from its core.extension.yml.
   * Defaults to `config/sync` next to the docroot.
   */
  configSync?: string
  /**
   * URL of the Drupal site the dev server passes requests to, so the site can
   * be browsed through it. Defaults to the web server in the DDEV container,
   * else to the site URL (`url`). `false` turns it off.
   */
  proxy?: string | false
  /**
   * Vite DevTools with the A11y check and the Drupal picker, on in dev.
   * `false` turns them off.
   */
  devtools: false | {
    picker: DrupalPickerOptions
  }
}

type DeepPartial<T> = T extends (...args: any[]) => any
  ? T
  : T extends readonly unknown[]
    ? T
    : T extends object
      ? { [K in keyof T]?: DeepPartial<T[K]> }
      : T

export type UserOptions = DeepPartial<Options>

export interface Context {
  dev: boolean
  prod: boolean
  port: number
  url: string
  root: string
  options: Options
  config: UserConfig
  resolvedConfig: ResolvedConfig
  themeName: string
  distThemeName: string
  themeBasePath: string
}

/**
 * Like defu, but arrays from the user options replace the default arrays.
 */
const merge = createDefu((obj, key, value) => {
  if (Array.isArray(value)) {
    obj[key] = value
    return true
  }
})

function getDefaults(themeName: string): Options {
  const vueUsePreset = builtinPresets['@vueuse/core']() as InlinePreset
  vueUsePreset.imports = vueUsePreset.imports.filter(i => typeof i !== 'string' || !['toRef', 'toValue'].includes(i))

  return {
    vue: {
      template: {
        compilerOptions: {
          isCustomElement: tag => tag.includes('-'),
        },
      },
    },
    unimport: {
      dts: './.uebertool/unimport.d.ts',
      dirs: [
        './js/**/*',
        './templates/**/*.{js|ts}',
      ],
      dirsScanOptions: {
        fileFilter(file) {
          return !file.includes('.stories.')
        },
      },
      presets: [
        'pinia',
        'vue',
        vueUsePreset,
      ],
      addons: {
        vueTemplate: true,
      },
      imports: [
        { name: 'default', as: 'Alpine', from: 'alpinejs' },
      ],
    },
    components: {
      dts: './.uebertool/components.d.ts',
      resolvers: [
        HeadlessUiResolver(),
        VueUseComponentsResolver(),
        VueUseDirectiveResolver(),
        LocalComponentResolver(),
      ],
    },
    ce: {
      prefix: themeName || 'ce',
    },
    breakpoints: {
      multipliers: [
        '1x',
        '2x',
      ],
    },
    features: {
      resetTheme: true,
      twighmr: true,
      clearCache: 'drush cr',
    },
    baseTheme: false,
    devtools: {
      picker: {},
    },
  }
}

export default (ctx: Context, options: UserOptions): Plugin => {
  const themeName = getThemeName()
  ctx.options = merge(options, getDefaults(themeName)) as Options
  ctx.root = process.cwd()
  ctx.themeName = themeName
  ctx.distThemeName = getDistThemeName(themeName)
  ctx.themeBasePath = getThemeBasePath(themeName)

  return {
    name: 'vite-plugin-uebertool-context',
    enforce: 'pre',
    config(config, { command }) {
      ctx.config = config
      ctx.dev = command === 'serve'
      ctx.prod = !ctx.dev
      ctx.port = config.server?.port || 5173
      ctx.url = !options.url && (process.env.UEBERTOOL_URL || process.env.DDEV_PRIMARY_URL)
        ? `${process.env.UEBERTOOL_URL || process.env.DDEV_PRIMARY_URL}:${ctx.port}`
        : `${ctx.options.url || 'http://localhost'}:${ctx.port}`
    },
    configResolved(config) {
      ctx.resolvedConfig = config
    },
  }
}
