import path from 'node:path'
import fs from 'node:fs/promises'
import { constants } from 'node:fs'
import type { Plugin, ResolvedConfig } from 'vite'
import YAML from 'yaml'
import { defu } from 'defu'
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
          const filename = path.parse(assetOrChunk.fileName).name
          const base = filename.split('.')[0]
          const ext = path.parse(assetOrChunk.fileName).ext.replace('.', '')
          const basePath = path.dirname(assetOrChunk.fileName)
          const lib = `${basePath.match(/^(js|css)$/) ? `${basePath}/` : ''}${base}`
          // const lib = base

          if (basePath === 'assets' || basePath === '.')
            return

          if (base === ctx.distThemeName)
            return

          if (assetOrChunk.fileName.match(/\.ce\./))
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

            library[lib].css = defu(library[lib].css, {
              [key]: {
                [`/themes/custom/${ctx.themeName}/dist/${assetOrChunk.fileName}`]: {
                  type: 'external',
                  minified: true,
                  preprocessed: true,
                },
              },
            })
          }

          if (ext.match(/(js|ts(x)?|vue)/)) {
            if (!assetOrChunk.fileName.match(/main\..*\.(ts|js)/)) {
              library[lib].header = true
              library[lib].dependencies = [
                `${ctx.distThemeName}/js/main`,
              ]
            }
            library[lib].js = defu(library[lib].js, {
              [`/themes/custom/${ctx.themeName}/dist/${assetOrChunk.fileName}`]: {
                type: 'file',
                minified: true,
                preprocessed: true,
                attributes: {
                  crossorigin: {},
                  type: 'module',
                },
              },
            })
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
        name: 'libraries.json',
        fileName: 'libraries.json',
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
        const filename = path.parse(file).name
        const ext = path.parse(file).ext.replace('.', '')
        const proxy = `http://localhost:5173/${file}`
        const basePath = path.dirname(file)
        // const lib = `${basePath}/${filename}`
        const lib = `${basePath.match(/^(js|css)$/) ? `${basePath}/` : ''}${filename}`
        // const lib = filename

        if (!(lib in library)) {
          library[lib] = {
            type: 'external',
          }
        }

        if (file.match(/\.ce\./))
          return

        if (ext === 'css') {
          let key = 'theme'
          if (lib.match(/\/base\//))
            key = 'base'
          if (lib.match(/\/layout\//))
            key = 'layout'
          if (lib.match(/\/components\//))
            key = 'component'

          library[lib].css = defu(library[lib].css, {
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
          })
        }

        if (ext.match(/(js|ts(x)?|vue)/)) {
          if (!lib.match(/main/)) {
            library[lib].dependencies = [
              `${ctx.distThemeName}/js/main`,
            ]
          }

          library[lib].js = defu(library[lib].js, {
            [proxy]: {
              attributes: {
                crossorigin: {},
                type: 'module',
              },
            },
          })
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
        await fs.writeFile(`${config.build.outDir}/libraries.json`, JSON.stringify(library))
      }
    },
  }
}
