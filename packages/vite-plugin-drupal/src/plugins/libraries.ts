import Path from 'path'
import fs from 'fs/promises'
import { constants } from 'fs'
import type { Plugin, ResolvedConfig } from 'vite'
import YAML from 'yaml'
import type { Context } from './context'

// @TODO extract common code into separate function.
export default function drupalLibraries(ctx: Context): Plugin {
  let config: ResolvedConfig
  let files: string[]

  return {
    name: 'vite-plugin-drupal-libraries',
    configResolved(resolvedConfig) {
      config = resolvedConfig
      files = resolvedConfig.build?.rollupOptions?.input as string[] ?? []
    },
    generateBundle(_, bundle, isWrite) {
      if (!isWrite || !ctx.isProduction)
        return

      const library: Record<string, any> = {}

      Object.values(bundle)
        .filter(
          assetOrChunk =>
            assetOrChunk.type === 'asset' || (assetOrChunk.type === 'chunk' && assetOrChunk.code !== '\n' && assetOrChunk.isDynamicEntry === false),
        )
        .forEach((assetOrChunk) => {
          const filename = Path.parse(assetOrChunk.fileName).name
          const base = filename.split('.')[0]
          const ext = Path.parse(assetOrChunk.fileName).ext.replace('.', '')
          const basePath = Path.dirname(assetOrChunk.fileName)
          const lib = `${basePath}/${base}`

          if (base === ctx.distThemeName)
            return

          if (!(lib in library))
            library[lib] = {}

          if (ext === 'css') {
            let key = 'theme'
            if (lib.match(/\/base\//))
              key = 'base'
            if (lib.match(/\/layout\//))
              key = 'layout'
            if (lib.match(/\/components\//))
              key = 'component'

            library[lib].css = {
              [key]: {
                [`/themes/custom/${ctx.themeName}/dist/${assetOrChunk.fileName}`]: {
                  type: 'external',
                  minified: true,
                  preprocess: false,
                },
              },
            }
          }

          if (ext.match(/(js|ts(x)?|vue)/)) {
            if (lib.match(/main/)) {
              library[lib].dependencies = [
                `${ctx.distThemeName}/js/main`,
              ]
            }
            library[lib].js = {
              [`/themes/custom/${ctx.themeName}/dist/${assetOrChunk.fileName}`]: {
                type: 'external',
                minified: true,
                attributes: {
                  crossorigin: {},
                  type: 'module',
                },
              },
            }
          }
        })

      this.emitFile({
        type: 'asset',
        name: `${ctx.distThemeName}.libraries.yml`,
        fileName: `${ctx.distThemeName}.libraries.yml`,
        source: YAML.stringify(library),
      })

      this.emitFile({
        type: 'asset',
        name: `${ctx.distThemeName}.libraries.json`,
        fileName: `${ctx.distThemeName}.libraries.json`,
        source: JSON.stringify(library),
      })
    },
    async buildStart() {
      if (ctx.isProduction)
        return
      const library: Record<string, any> = {
        vite: {
          js: {
            'http://localhost:5173/@vite/client': {
              type: 'external',
              attributes: { type: 'module' },
            },
          },
        },
      }

      files.forEach(async (file) => {
        const filename = Path.parse(file).name
        const ext = Path.parse(file).ext.replace('.', '')
        const proxy = `http://localhost:5173/${file}`
        const basePath = Path.dirname(file)
        const lib = `${basePath}/${filename}`

        if (!(lib in library)) {
          library[lib] = {
            type: 'external',
          }
        }

        if (ext === 'css') {
          let key = 'theme'
          if (lib.match(/\/base\//))
            key = 'base'
          if (lib.match(/\/layout\//))
            key = 'layout'
          if (lib.match(/\/components\//))
            key = 'component'

          library[lib].css = {
            [key]: {
              [proxy]: {
                attributes: {
                  ...(filename.match(/tailwind/)
                    ? {
                        crossorigin: 'anonymous',
                      }
                    : {}),
                },
              },
            },
          }
        }

        if (ext.match(/(js|ts(x)?|vue)/)) {
          if (lib.match(/main/)) {
            library[lib].dependencies = [
              `${ctx.distThemeName}/js/main`,
            ]
          }

          library[lib].js = {
            [proxy]: {
              attributes: {
                crossorigin: {},
                type: 'module',
              },
            },
          }
        }
      })

      try {
        await fs.access(config.build.outDir, constants.F_OK)
      }
      catch {
        await fs.mkdir(config.build.outDir, { recursive: true })
      }
      finally {
        await fs.writeFile(`${config.build.outDir}/${ctx.distThemeName}.libraries.yml`, YAML.stringify(library))
        await fs.writeFile(`${config.build.outDir}/${ctx.distThemeName}.libraries.json`, JSON.stringify(library))
      }
    },
  }
}
