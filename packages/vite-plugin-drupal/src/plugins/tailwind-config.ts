import process from 'node:process'
import type { Plugin, ResolvedConfig } from 'vite'
import fse from 'fs-extra'
import YAML from 'yaml'
import resolveConfig from 'tailwindcss/resolveConfig.js'
import type { Context } from './context'

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
    return YAML.stringify(tailwindConfig.theme)
  }
  catch (e) {
    console.warn(`No tailwind.config.js file found in ${process.cwd()}!\n${e}`)
    return ''
  }
}
