import type { Plugin, UserConfig } from 'vite'
import type { Context } from './context'
import { relative, resolve } from 'node:path'
import process from 'node:process'
import { glob } from 'tinyglobby'

const VUE_RUNTIME_REGEX = /@vue\+runtime/
const ALPINEJS_REGEX = /alpinejs@/

const stripExt = (file: string) => file.replace(/\.[^./]+$/, '')

export default (ctx: Context): Plugin => {
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

      const corsOrigins = getSiteOrigins(ctx)

      // Vite merges the returned partial config into the user config itself.
      return {
        // In dev Vite serves the theme at its docroot path, like Drupal does.
        base: ctx.dev
          ? `${ctx.themeBasePath}/`
          : `${ctx.themeBasePath}/${(config.build?.outDir || 'dist').replace(/^(?:\.?\/)+/, '')}`,
        // Public files are served by Drupal, css.ts rewrites `~/public` to the theme URL.
        publicDir: false,
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
        // JSX in .ce.tsx/.ce.jsx files renders with Preact.
        oxc: {
          jsx: { importSource: 'preact' },
        },
        define: {
          __DEV__: ctx.dev ? 'true' : 'false',
          __VUE_OPTIONS_API__: false,
        },
        build: {
          target: 'esnext',
          manifest: true,
          rolldownOptions: {
            input,
            output: {
              codeSplitting: {
                groups: [
                  { name: 'vue.runtime.esm-browser.prod', test: VUE_RUNTIME_REGEX },
                  { name: 'alpine.runtime', test: ALPINEJS_REGEX },
                ],
              },
              assetFileNames: (asset) => {
                const src = asset.originalFileNames[0]
                return src && !src.startsWith('..')
                  ? `${stripExt(src)}.[hash][extname]`
                  : 'assets/[name].[hash][extname]'
              },
              entryFileNames: (chunk) => {
                const src = chunk.facadeModuleId && !chunk.facadeModuleId.includes('\0')
                  ? relative(ctx.root, chunk.facadeModuleId)
                  : ''
                return src && !src.startsWith('..')
                  ? `${stripExt(src)}.[hash].js`
                  : '[name].[hash].js'
              },
            },
          },
        },
        server: {
          ...(corsOrigins.length > 0 && {
            cors: {
              origin: corsOrigins,
            },
          }),
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
      } satisfies UserConfig
    },
  }
}

/**
 * Origins of the Drupal site (`UEBERTOOL_URL`, `DDEV_PRIMARY_URL`, `url`).
 */
export function getSiteOrigins(ctx: Context): string[] {
  return Array.from(new Set(
    [process.env.UEBERTOOL_URL, process.env.DDEV_PRIMARY_URL, ctx.options.url]
      .filter((url): url is string => !!url)
      .map(url => url.replace(/\/+$/, '')),
  ))
}
