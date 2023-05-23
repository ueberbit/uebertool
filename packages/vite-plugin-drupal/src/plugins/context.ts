import path from 'node:path'
import type { Plugin, UserConfig } from 'vite'
import { defu } from 'defu'
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
import { getDistThemeName, getThemeName } from '../utils'
import LocalComponentResolve from '../importResolver'

export default (ctx: Context): Plugin => ({
  name: 'vite-plugin-drupal-context',
  enforce: 'pre',
  config(config) {
    ctx.config = config
  },
})

export interface UserOptions {
  vue?: VueOptions
  icons?: IconsOptions
  unimport?: Partial<Parameters<typeof Unimport.vite>>[0]
  components?: ComponentOptions
  themePackage?: string
  css?: {
    cascadeLayers?: boolean
  }
  ce?: {
    prefix?: string
  }
  breakpoints?: {
    multipliers?: string[]
  }
}

export interface DefaultOptions extends UserOptions {
  config?: UserConfig
  root?: string
  ce: {
    prefix: string
  }
  breakpoints: {
    multipliers: string[]
  }
}

export interface Context {
  isProduction: boolean
  root: string
  options: DefaultOptions
  config: UserConfig
  themeName: string
  distThemeName: string
}

const defaults: DefaultOptions = {
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
    dts: './@types/unimport.d.ts',
    dirs: [
      './js/**/*',
      './templates/**/*',
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
    dts: './@types/components.d.ts',
    resolvers: [
      HeadlessUiResolver(),
      VueUseComponentsResolver(),
      VueUseDirectiveResolver(),
      LocalComponentResolve(),
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
}

export const createContext = (options: UserOptions, root = process.cwd()): Context => ({
  isProduction: process.env.NODE_ENV === 'production',
  options: defu(options, defaults) as DefaultOptions,
  root,
  config: {},
  themeName: getThemeName(),
  distThemeName: getDistThemeName(),
})
