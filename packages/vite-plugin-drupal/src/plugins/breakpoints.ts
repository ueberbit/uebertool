import type { Plugin, ResolvedConfig } from 'vite'
import type { Context } from './context'
import fse from 'fs-extra'
import defaultTheme from 'tailwindcss/defaultTheme'
import YAML from 'yaml'

/**
 *
 * @param theme Breakpoint theme.
 * @param group Breakpoint group.
 * @param name Breakpoint name.
 * @param multipliers Breakpoint multipliers.
 * @param size Breakpoint size.
 * @returns Drupal Breakpoint entry.
 */
function getScreen(theme: string, group: string, name: string, multipliers: string[], size?: string) {
  return {
    [[theme, group, name].join('.')]: {
      label: name,
      mediaQuery: size ? `all and (min-width: ${size})` : '',
      weight: 0,
      multipliers: [
        ...multipliers,
      ],
      ...(group && {
        group: `${theme} ${group}`,
      }),
    },
  }
}

async function generateBreakpoints(theme: string, multipliers: string[]) {
  let screens = {}
  const tailwindConfig = defaultTheme
  const breakpoints = {
    ...tailwindConfig.screens ?? {},
  }
  const group = 'Tailwind'

  screens = {
    ...getScreen(theme, group, 'xs', multipliers),
  }

  ;(Object.keys(breakpoints) as Array<keyof typeof tailwindConfig.screens>).forEach((screen) => {
    screens = {
      ...screens,
      ...getScreen(theme, group, screen, multipliers, breakpoints[screen]),
    }
  })
  return screens
}

export default (ctx: Context): Plugin => {
  let config: ResolvedConfig

  return {
    name: 'vite-plugin-uebertool-breakpoints',
    configResolved(resolvedConfig) {
      config = resolvedConfig
    },
    async generateBundle(_, bundle, isWrite) {
      const screens = await generateBreakpoints(ctx.themeName, ctx.options.breakpoints.multipliers)
      if (!isWrite || ctx.dev || !screens)
        return

      this.emitFile({
        type: 'asset',
        name: `${ctx.distThemeName}.breakpoints.yml`,
        fileName: `${ctx.distThemeName}.breakpoints.yml`,
        source: YAML.stringify(screens),
      })
    },
    async buildStart() {
      if (ctx.prod)
        return

      const screens = await generateBreakpoints(ctx.themeName, ctx.options.breakpoints.multipliers)

      if (!screens)
        return

      await fse.outputFile(`${config.build.outDir}/${ctx.distThemeName}.breakpoints.yml`, YAML.stringify(screens))
    },
  }
}
