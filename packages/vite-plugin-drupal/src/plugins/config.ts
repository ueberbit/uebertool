/* eslint-disable @typescript-eslint/no-var-requires */
import { basename, dirname, relative, resolve } from 'node:path'
import fs from 'node:fs'
import type { Plugin } from 'vite'
import { mergeConfig } from 'vite'
import fg from 'fast-glob'
import type { Context } from './context'

const postCssConfig = () => {
  return fs.promises.access('postcss.config.js', fs.constants.F_OK)
    .then(() => true)
    .catch(() => false)
}

export default (ctx: Context): Plugin => {
  const assetMap = new Map<string, string>()

  return {
    name: 'vite-plugin-uebertool-config',
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
            '@/': `${resolve(process.cwd())}/`,
            '~~/': `${resolve(process.cwd())}/`,
            '@@/': `${resolve(process.cwd())}/`,
            'assets/': `${resolve(process.cwd(), 'assets')}/`,
            'public': `${resolve(process.cwd(), 'public')}/`,
          },
        },
        define: {
          __DEV__: ctx.dev ? 'true' : 'false',
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
              ignore: [
                '**/*.stories.*',
                '**/*.ce.*',
                '**/_*',
                '**/*.d.ts',
                './js/composables/**',
                './js/stores/**',
                './js/utils/**',
              ],
            }),
            output: {
              manualChunks: {
                'vue.runtime.esm-browser.prod': ['vue'],
                'alpine.runtime': ['alpinejs'],
              },
              assetFileNames: (assetInfo: any) => {
                const base = basename(assetInfo.name)
                let dir = dirname(assetInfo.name)

                if (assetMap.has(base))
                  return assetMap.get(base)

                dir = dir.startsWith('.') ? '' : `${dir}/`
                assetMap.set(base, `${dir}[name].[hash].[ext]`)

                return '[name].[hash].[ext]'
              },
              entryFileNames: (assetInfo: any) => {
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
      })
    },
  }
}
