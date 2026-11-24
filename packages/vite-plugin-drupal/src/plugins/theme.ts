import type { Plugin, ResolvedConfig } from 'vite'
import type { Context } from './context'
import fs from 'node:fs/promises'
import path from 'node:path'
import YAML from 'yaml'

/**
 * Dist libraries added to the info.yml, each only if one of its sources exists.
 */
const defaultLibraries: Record<string, string[]> = {
  'css__tailwind': ['css/tailwind.css'],
  'js__main': ['js/main.ts', 'js/main.js'],
  'css__gin-custom': ['css/gin-custom.css'],
}

export default (ctx: Context): Plugin => {
  let config: ResolvedConfig

  return {
    name: 'vite-plugin-uebertool-drupal-theme',
    configResolved(resolvedConfig) {
      config = resolvedConfig
    },
    async buildStart() {
      const exists = (source: string) => fs.access(path.resolve(ctx.root, source)).then(() => true, () => false)
      const libraries = await Promise.all(Object.entries(defaultLibraries).map(async ([library, sources]) =>
        (await Promise.all(sources.map(exists))).includes(true)
          ? `${ctx.distThemeName}/${library}`
          : false,
      ))

      const content = {
        'name': `${ctx.themeName} dist`,
        'type': 'theme',
        'base theme': ctx.options.baseTheme,
        'description': `${ctx.themeName.toUpperCase()} Theme for compiled assets.`,
        'package': `${ctx.options.themePackage || ctx.themeName}`,
        'core_version_requirement': '^10.3 || ^11',
        'hidden': true,
        'libraries': libraries.filter(Boolean),
      }

      if (ctx.dev) {
        await fs.mkdir(config.build.outDir, { recursive: true })
        await fs.writeFile(`${config.build.outDir}/${ctx.distThemeName}.info.yml`, YAML.stringify(content))
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
