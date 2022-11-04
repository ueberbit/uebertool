import path from 'node:path'
import type { Plugin, UserConfig } from 'vite'
import { defu } from 'defu'
import type { Options as VueOptions } from '@vitejs/plugin-vue'
import type { Options as IconsOptions } from 'unplugin-icons'
import { FileSystemIconLoader } from 'unplugin-icons/loaders'
import fg from 'fast-glob'
import { getDistThemeName, getThemeName } from '../utils'

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
  themePackage?: string
  css?: {
    cascadeLayers?: boolean
  }
  ce?: {
    prefix?: string
  }
}

export interface DefaultOptions extends UserOptions {
  config?: UserConfig
  root?: string
  ce: {
    prefix: string
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
  ce: {
    prefix: getThemeName() || 'ce',
  },
  css: {
    cascadeLayers: true,
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
