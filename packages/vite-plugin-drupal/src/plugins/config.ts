/* eslint-disable @typescript-eslint/no-var-requires */
import { dirname, relative, resolve } from 'path'
import fs from 'fs'
import type { Plugin, UserConfigExport } from 'vite'
import { mergeConfig } from 'vite'
import fg from 'fast-glob'

import type { Context } from './context'

const postCssConfig = () => {
  return fs.promises.access('postcss.config.js', fs.constants.F_OK)
    .then(() => true)
    .catch(() => false)
}

export default (ctx: Context): Plugin => {
  return {
    name: 'vite-plugin-drupal-config',
    async config(config) {
      return mergeConfig(config, {
        ...(!(await postCssConfig()) && {
          css: {
            postcss: {
              plugins: [
                require('postcss-import')(),
                require('tailwindcss/nesting')(),
                require('tailwindcss')(),
                require('@ueberbit/postcss/stripcolor')(),
                require('autoprefixer')(),
              ],
            },
          },
        }),
        base: './',
        resolve: {
          alias: {
            '~/': `${resolve(process.cwd())}/`,
          },
        },
        define: {
          __DEV__: !ctx.isProduction ? 'true' : 'false',
        },
        build: {
          target: 'esnext',
          manifest: true,
          rollupOptions: {
            input: await fg([
              '(js|css|templates)/**/*.(js|jsx|css|ts|tsx)',
            ], {
              onlyFiles: true,
              ignore: ['**/*.stories.*', '**/_*', '**/*.d.ts'],
            }),
            output: {
              manualChunks: {
                'vue.runtime.esm-browser.prod': ['vue'],
              },
              assetFileNames: (assetInfo: any) => {
                const base = dirname(assetInfo.name)
                return `${base}/[name].[hash].[ext]`
              },
              entryFileNames: (assetInfo) => {
                if (assetInfo.facadeModuleId?.match(/.(ts|js|tsx|jsx|vue)$/)) {
                  const base = dirname(relative('./', assetInfo.facadeModuleId))
                  return `${base}/[name].[hash].js`
                }
                return '[name].[hash].js'
              },
            },
          },
        },
        server: {
          hmr: {
            protocol: 'ws',
          },
          watch: {
            ignored: [
              '**/*.stories.(mdx|jsx|md)',
              '**/*.yml',
            ],
          },
        },
      } as UserConfigExport)
    },
  }
}
