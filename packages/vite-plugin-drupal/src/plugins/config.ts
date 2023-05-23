/* eslint-disable @typescript-eslint/no-var-requires */
import { dirname, relative, resolve } from 'node:path'
import fs from 'node:fs'
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
          __VUE_OPTIONS_API__: false,
        },
        build: {
          target: 'esnext',
          manifest: true,
          rollupOptions: {
            input: await fg([
              '(js|css|templates)/**/*.(js|jsx|css|ts|tsx)',
            ], {
              onlyFiles: true,
              ignore: ['**/*.stories.*', '**/*.ce.*', '**/_*', '**/*.d.ts'],
            }),
            output: {
              manualChunks: {
                'vue.runtime.esm-browser.prod': ['vue'],
                'alpine.runtime': ['alpinejs'],
              },
              assetFileNames: (assetInfo: any) => {
                const base = dirname(assetInfo.name).replace(/^\./, '').trim()
                if (base)
                  return `${base}/[name].[hash].[ext]`
                return '[name].[hash].[ext]'
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
