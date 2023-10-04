import fs from 'node:fs/promises'
import { constants } from 'node:fs'
import type { Plugin, ResolvedConfig } from 'vite'
import YAML from 'yaml'
import type { Context } from './context'

export default (ctx: Context): Plugin => {
  let config: ResolvedConfig

  const themeInfoDefault = {
    'name': `${ctx.themeName} dist`,
    'type': 'theme',
    'base theme': ctx.options.baseTheme,
    'description': `${ctx.themeName.toUpperCase()} Theme for compiled assets.`,
    'package': `${ctx.options.themePackage || ctx.themeName}`,
    'core_version_requirement': '^9 || ^10',
    'hidden': true,
    'libraries': [
      `${ctx.distThemeName}/css/tailwind`,
      `${ctx.distThemeName}/js/main`,
      `${ctx.distThemeName}/css/gin-custom`,
    ],

  }

  return {
    name: 'vite-plugin-uebertool-drupal-theme',
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
          await fs.writeFile(`${config.build.outDir}/${ctx.distThemeName}.info.yml`, YAML.stringify(content))
        }
      }
      else {
        this.emitFile({
          type: 'asset',
          name: `${ctx.distThemeName}.info.yml`,
          fileName: `${ctx.distThemeName}.info.yml`,
          source: YAML.stringify(content),
        })
      }
    },
  }
}
