import fs from 'node:fs/promises'
import { constants } from 'node:fs'
import type { Plugin } from 'vite'
import YAML from 'yaml'
import type { Context } from './context'

export default (ctx: Context): Plugin => {
  let config

  const themeInfoDefault = {
    'name': `${ctx.themeName} dist`,
    'type': 'theme',
    'base theme': 'stable',
    'description': `${ctx.themeName.toUpperCase()} Theme for compiled assets.`,
    'package': `${ctx.options.themePackage || ctx.themeName}`,
    'core': '8.x',
    'core_version_requirement': '^8 || ^9',
    'hidden': true,
  }

  return {
    name: 'vite-plugin-drupal-theme',
    configResolved(resolvedConfig) {
      config = resolvedConfig
    },
    async buildStart() {
      const content = {
        ...themeInfoDefault,
      }

      if (config.mode === 'development') {
        try {
          await fs.access(config.build.outDir, constants.F_OK)
        }
        catch {
          await fs.mkdir(config.build.outDir, { recursive: true })
        }
        finally {
          await fs.writeFile(`${config.build.outDir}/ueberbit_dist.info.yml`, YAML.stringify(content))
        }
      }
      else {
        this.emitFile({
          type: 'asset',
          name: 'ueberbit_dist.info.yml',
          fileName: 'ueberbit_dist.info.yml',
          source: YAML.stringify(content),
        })
      }
    },
  }
}
