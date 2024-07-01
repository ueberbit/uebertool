import { basename, dirname, relative, resolve } from 'node:path'
import fs from 'node:fs'
import type { Plugin } from 'vite'
import { mergeConfig } from 'vite'
import fg from 'fast-glob'
import type { Context } from './context'

function postCssConfig() {
  return fs.promises.access('postcss.config.js', fs.constants.F_OK)
    .then(() => true)
    .catch(() => false)
}

export default (ctx: Context): Plugin => {
  const assetMap = new Map<string, string>()

  return {
    name: 'vite-plugin-uebertool-config',
    async config(config) {
      const input = await fg([
        '(js|css|templates)/**/*.(js|jsx|css|ts|tsx)',
        'components/**/(assets|src|js|css)/*.(js|jsx|css|ts|tsx)',
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
      })

      return mergeConfig(config, {
        ...(!(await postCssConfig()) && {
          css: {
            postcss: {
              plugins: [
                // @ts-expect-error missing types
                ((await import('postcss-import')).default),
                ((await import('tailwindcss/nesting/index.js')).default),
                ((await import('tailwindcss')).default),
                // @ts-expect-error missing types
                ((await import('@ueberbit/postcss/stripcolor')).default),
                ((await import('autoprefixer')).default),
              ],
            },
          },
        }),
        base: ctx.dev ? './' : ctx.themeBasePath + (config.build?.outDir || '/dist'),
        publicDir: ctx.dev ? '/public' : `${ctx.themeBasePath}/public`,
        resolve: {
          alias: {
            '~/': `${resolve(ctx.root)}/`,
            '@/': `${resolve(ctx.root)}/`,
            '~~/': `${resolve(ctx.root)}/`,
            '@@/': `${resolve(ctx.root)}/`,
            'assets/': `${resolve(ctx.root, 'assets')}/`,
            '@assets/': `${resolve(ctx.root, 'assets')}/`,
            'public/': `${resolve(ctx.root, 'public')}/`,
            '@public/': `${resolve(ctx.root, 'public')}/`,
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
            input,
            output: {
              manualChunks: (id: string) => {
                if (id.match(/@vue\+runtime/))
                  return 'vue.runtime.esm-browser.prod'

                if (id.match(/alpinejs@/))
                  return 'alpine.runtime'
              },
              assetFileNames: (assetInfo: any) => {
                const base = basename(assetInfo.name)
                let dir = dirname(assetInfo.name)

                if (base.match(/.(woff2?)$/))
                  return '[name].[ext]'

                if (assetMap.has(base))
                  return assetMap.get(base)

                const fullPath = input.find(file => file.endsWith(base))
                if (fullPath)
                  dir = dirname(fullPath)

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
