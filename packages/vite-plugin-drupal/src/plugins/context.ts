import path from 'node:path'
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
import { FileSystemIconLoader } from 'unplugin-icons/loaders'
import fg from 'fast-glob'
import { defu } from 'defu'
import { getDistThemeName, getThemeName } from '../utils'
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
  experimental: {
    twighmr: boolean
  }
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
}

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
      ...fg.sync([
        './assets/icons/**',
      ], {
        onlyDirectories: true,
        deep: 1,
      }).reduce((a, c) => {
        const key = c.split(path.sep).at(-1)
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
      '@vueuse/core',
    ],
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
  experimental: {
    twighmr: false,
  },
}

export default (ctx: Context, options: UserOptions): Plugin => {
  ctx.options = defu<Options, [Options]>(options, defaults)
  ctx.port = 5173
  ctx.url = `http://localhost:${ctx.port}`
  ctx.root = process.cwd()
  ctx.themeName = getThemeName()
  ctx.distThemeName = getDistThemeName()

  return {
    name: 'vite-plugin-uebertool-context',
    enforce: 'pre',
    config(config) {
      ctx.config = config
    },
    configResolved(config) {
      ctx.dev = config.mode === 'development'
      ctx.prod = !ctx.dev
      ctx.resoledConfig = config
    },
  }
}
