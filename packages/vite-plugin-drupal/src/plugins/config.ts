import type { Plugin } from 'vite'
import type { Context } from './context'
import { basename, dirname, relative, resolve } from 'node:path'
import process from 'node:process'
import { glob } from 'tinyglobby'
import { mergeConfig } from 'vite'

const VUE_RUNTIME_REGEX = /@vue\+runtime/
const ALPINEJS_REGEX = /alpinejs@/
const FONT_REGEX = /.woff2?$/
const CSS_REGEX = /\.css$/
const JS_REGEX = /.(ts|js|tsx|jsx|vue)$/

export default (ctx: Context): Plugin => {
  const assetMap = new Map<string, string>()

  return {
    name: 'vite-plugin-uebertool-config',
    async config(config) {
      const input = await glob([
        '(js|css|templates)/**/*.(js|jsx|css|scss|ts|tsx)',
        'components/**/(assets|src|js|css)/*.(js|jsx|css|scss|ts|tsx)',
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
        base: ctx.dev
          ? './'
          : ctx.themeBasePath + (config.build?.outDir || '/dist'),
        publicDir: ctx.dev
          ? '/public'
          : `${ctx.themeBasePath}/public`,
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
                if (VUE_RUNTIME_REGEX.test(id))
                  return 'vue.runtime.esm-browser.prod'

                if (ALPINEJS_REGEX.test(id))
                  return 'alpine.runtime'
              },
              assetFileNames: (assetInfo: any) => {
                const base = basename(assetInfo.name || assetInfo.names[0])
                let dir = dirname(assetInfo.name || assetInfo.names[0])

                if (FONT_REGEX.test(base))
                  return '[name].[ext]'

                if (assetMap.has(base))
                  return assetMap.get(base)

                // Match whole file names only, e.g. "slider.css" must not match "aoa-slider.css".
                const isFile = (file: string, name: string) => file === name || file.endsWith(`/${name}`)
                const fullPath = input.find(file => isFile(file, base))
                  || input.find(file => isFile(file, base.replace(CSS_REGEX, '.scss')))

                if (fullPath)
                  dir = dirname(fullPath)

                dir = dir.startsWith('.')
                  ? ''
                  : `${dir}/`

                assetMap.set(base, `${dir}[name].[hash].[ext]`)
                return '[name].[hash].[ext]'
              },
              entryFileNames: (assetInfo: any) => {
                if (assetInfo.facadeModuleId?.match(JS_REGEX)) {
                  const base = dirname(relative('./', assetInfo.facadeModuleId))
                  return `${base}/[name].[hash].js`
                }
                return '[name].[hash].js'
              },
            },
          },
        },
        server: {
          cors: {
            origin: '*',
          },
          host: true,
          strictPort: true,
          ...(process.env.DDEV_PRIMARY_URL?.startsWith('https://') && {
            ws: {
              protocol: 'wss',
            },
          }),
          watch: {
            ignored: [
              '**/*.stories.(mdx|jsx|md)',
              '**/*.yml',
              '**/.uebertool/**',
            ],
          },
        },
      })
    },
  }
}
