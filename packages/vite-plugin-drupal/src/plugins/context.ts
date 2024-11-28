import path from 'node:path'
import process from 'node:process'
import type { Plugin, ResolvedConfig, UserConfig } from 'vite'
import type { Options as VueOptions } from '@vitejs/plugin-vue'
import type { Options as IconsOptions } from 'unplugin-icons'
import type Unimport from 'unimport/unplugin'
import type { Options as ComponentOptions } from 'unplugin-vue-components'
import {
  HeadlessUiResolver,
  VueUseComponentsResolver,
  VueUseDirectiveResolver,
} from 'unplugin-vue-components/resolvers'
import type { InlinePreset } from 'unimport'
import { builtinPresets } from 'unimport'
import { FileSystemIconLoader } from 'unplugin-icons/loaders'
import { globSync } from 'tinyglobby'
import { defu } from 'defu'
import { getDistThemeName, getThemeBasePath, getThemeName } from '../utils'
import LocalComponentResolver from '../importResolver'

export interface Options {
  url: string
  vue: VueOptions
  icons: IconsOptions
  unimport: Partial<Parameters<typeof Unimport.vite>>[0]
  components: ComponentOptions
  themePackage?: string
  css: {
    cascadeLayers: boolean
  }
  ce: {
    prefix: string
  }
  breakpoints: {
    multipliers: string[]
  }
  features: {
    resetTheme: boolean
    twighmr: boolean
    clearCache: boolean | string
  }
  experimental: object
  baseTheme: string
}

export type UserOptions = Partial<Options>

export interface Context {
  dev: boolean
  prod: boolean
  port: number
  url: string
  root: string
  options: Options
  config: UserConfig
  resoledConfig: ResolvedConfig
  themeName: string
  distThemeName: string
  themeBasePath: string
}

const vueUsePreset = builtinPresets['@vueuse/core']() as InlinePreset
vueUsePreset.imports = vueUsePreset.imports.filter(i => typeof i !== 'string' || !['toRef', 'toValue'].includes(i))

const defaults: Options = {
  url: 'http://localhost',
  vue: {
    template: {
      compilerOptions: {
        isCustomElement: tag => tag.includes('-'),
      },
    },
  },
  icons: {
    compiler: 'web-components',
    webComponents: {
      autoDefine: true,
    },
    customCollections: {
      [getThemeName()]: FileSystemIconLoader('assets/icons'),
      ...globSync([
        './assets/icons/**',
      ], {
        onlyDirectories: true,
        deep: 3,
      }).reduce((a, c) => {
        const key = c.replace(new RegExp(`${path.sep}$`), "").split(path.sep).at(-1);
        if (!key)
          return {}
        return {
          ...a,
          [key]: FileSystemIconLoader(`assets/icons/${key}`),
        }
      }, {}),
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
    prefix: getThemeName() || 'ce',
  },
  css: {
    cascadeLayers: true,
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
  experimental: {},
  baseTheme: 'stable9',
}

export default (ctx: Context, options: UserOptions): Plugin => {
  ctx.options = defu<Options, [Options]>(options, defaults)
  ctx.root = process.cwd()
  ctx.themeName = getThemeName()
  ctx.distThemeName = getDistThemeName()
  ctx.themeBasePath = getThemeBasePath()

  return {
    name: 'vite-plugin-uebertool-context',
    enforce: 'pre',
    config(config, { command }) {
      ctx.config = config
      ctx.dev = command === 'serve'
      ctx.prod = !ctx.dev
      ctx.port = config.server?.port || 5173
      ctx.url = `${ctx.options.url}:${ctx.port}`
    },
    configResolved(config) {
      ctx.resoledConfig = config
    },
  }
}
