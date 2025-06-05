import type { Plugin, ResolvedConfig } from 'vite'
import type { Context } from './context'
import process from 'node:process'
import fse from 'fs-extra'
import resolveConfig from 'tailwindcss/resolveConfig.js'
import YAML from 'yaml'

export default (ctx: Context): Plugin => {
  let config: ResolvedConfig
  return {
    name: 'vite-plugin-uebertool-tailwind-config',
    configResolved(resolvedConfig) {
      config = resolvedConfig
    },
    async handleHotUpdate({ file }) {
      if (file.match(/tailwind.config/)) {
        await fse.outputFile(`${config.build.outDir}/${ctx.distThemeName}.tailwind.yml`, await buildTailwindConfig())
      }
    },
    async buildStart() {
      if (ctx.prod)
        return

      await fse.outputFile(`${config.build.outDir}/${ctx.distThemeName}.tailwind.yml`, await buildTailwindConfig())
    },
    async generateBundle(_, bundle, isWrite) {
      const tailwindConfig = await buildTailwindConfig()
      if (!isWrite || ctx.dev)
        return

      this.emitFile({
        type: 'asset',
        name: `${ctx.distThemeName}.tailwind.yml`,
        fileName: `${ctx.distThemeName}.tailwind.yml`,
        source: tailwindConfig,
      })
    },
  }
}

async function buildTailwindConfig() {
  try {
    const tailwindConfigFile = await import(`${process.cwd()}/tailwind.config.js`)
    const tailwindConfig = resolveConfig(tailwindConfigFile.default)

    const resolveThemeValue = (key: any) => (key in tailwindConfig.theme ? tailwindConfig.theme[key] : undefined)
    const evaluateAndSerializeConfig = (obj: any): any => {
      if (typeof obj === 'function') {
        try {
          // Try evaluating the function with the theme resolver context
          return obj({ theme: resolveThemeValue })
        }
        catch (error) {
          console.error(`Error resolving function: ${error}`)
          return '[Unresolvable Function]' // Fallback if evaluation fails
        }
      }

      if (Array.isArray(obj)) {
        return obj.map(evaluateAndSerializeConfig) // Recursively handle arrays
      }

      if (typeof obj === 'object' && obj !== null) {
        return Object.keys(obj).reduce((acc: Record<string, any>, key) => {
          acc[key] = evaluateAndSerializeConfig(obj[key]) // Recursively handle objects
          return acc
        }, {})
      }

      return obj // Return the value if it's not a function or an object
    }

    // Evaluate and serialize the resolved config
    const evaluatedConfig = evaluateAndSerializeConfig(tailwindConfig.theme)

    return YAML.stringify(evaluatedConfig)
  }
  catch (e) {
    console.warn(`No tailwind.config.js file found in ${process.cwd()}!\n${e}`)
    return ''
  }
}
