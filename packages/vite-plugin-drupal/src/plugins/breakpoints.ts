import fs from 'node:fs/promises'
import { constants } from 'node:fs'
import type { Plugin } from 'vite'
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

const generateBreakpoints = async () => {
  let screens = {}
  try {
    const tailwindConfigFile = await import(`${process.cwd()}/tailwind.config.js`)
    const tailwindConfig = resolveConfig(tailwindConfigFile)
    const breakpoints = tailwindConfig.theme?.screens ?? {} as any
    const theme = 'UEBERBIT'
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

export default (ctx: Context): Plugin[] => {
  return [
    {
      name: 'vite-plugin-drupal-breakpoints-build',
      apply: 'build',
      async buildStart() {
        const screens = await generateBreakpoints()

        if (!screens)
          return

        if (!ctx.isProduction && ctx.config.build?.outDir) {
          try {
            await fs.access(ctx.config.build.outDir, constants.F_OK)
          }
          catch {
            await fs.mkdir(ctx.config.build.outDir, { recursive: true })
          }
          finally {
            await fs.writeFile(`${ctx.config.build.outDir}/ueberbit_dist.breakpoints.yml`, YAML.stringify(screens))
          }
        }
      },
    },
    {
      name: 'vite-plugin-drupal-breakpoints-serve',
      apply: 'serve',
      async buildStart() {
        const screens = await generateBreakpoints()

        if (!screens)
          return

        if (ctx.isProduction && ctx.config.build?.outDir) {
          this.emitFile({
            type: 'asset',
            name: 'ueberbit_dist.breakpoints.yml',
            fileName: 'ueberbit_dist.breakpoints.yml',
            source: YAML.stringify(screens),
          })
        }
      },
    },
  ]
}
