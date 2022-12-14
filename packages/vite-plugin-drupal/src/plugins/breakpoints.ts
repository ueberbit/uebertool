import fse from 'fs-extra'
import type { Plugin, ResolvedConfig } from 'vite'
import YAML from 'yaml'
import resolveConfig from 'tailwindcss/resolveConfig'

import type { Context } from './context'

/**
 *
 * @param theme Breakpoint theme.
 * @param group Breakpoint group.
 * @param name Breakpoint name.
 * @param size Breakpoint size.
 * @returns Drupal Breakpoint entry.
 */
const getScreen = (theme: string, group: string, name: string, size?: number) => {
  return {
    [[theme, group, name].join('.')]: {
      label: name,
      mediaQuery: size ? `all and (min-width: ${size})` : '',
      weight: 0,
      multipliers: [
        '1x',
      ],
      ...(group && {
        group: `${theme} ${group}`,
      }),
    },
  }
}

const generateBreakpoints = async (theme: string) => {
  let screens = {}
  try {
    const tailwindConfigFile = await import(`${process.cwd()}/tailwind.config.js`)
    const tailwindConfig = resolveConfig(tailwindConfigFile)
    const breakpoints = tailwindConfig.theme?.screens ?? {} as any
    const group = 'Tailwind'

    screens = {
      ...getScreen(theme, group, 'xs'),
    }

    Object.keys(breakpoints).forEach((screen) => {
      screens = {
        ...screens,
        ...getScreen(theme, group, screen, breakpoints[screen]),
      }
    })
  }
  catch (e) {
    console.warn(`No tailwind.config.js file found in ${process.cwd()}!\n${e}`)
  }
  return screens
}

export default (ctx: Context): Plugin => {
  let config: ResolvedConfig

  return {
    name: 'vite-plugin-drupal-breakpoints',
    configResolved(resolvedConfig) {
      config = resolvedConfig
    },
    async generateBundle(_, bundle, isWrite) {
      const screens = await generateBreakpoints(ctx.themeName)
      if (!isWrite || !ctx.isProduction || !screens)
        return

      if (ctx.isProduction && ctx.config.build?.outDir) {
        this.emitFile({
          type: 'asset',
          name: `${ctx.distThemeName}.breakpoints.yml`,
          fileName: `${ctx.distThemeName}.breakpoints.yml`,
          source: YAML.stringify(screens),
        })
      }
    },
    async buildStart() {
      const screens = await generateBreakpoints(ctx.themeName)

      if (!screens || ctx.isProduction)
        return

      await fse.outputFile(`${config.build.outDir}/${ctx.distThemeName}.breakpoints.yml`, YAML.stringify(screens))
    },
  }
}
