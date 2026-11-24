import type { Plugin, ResolvedConfig } from 'vite'
import type { Context } from './context'
import fs from 'node:fs/promises'
import path from 'node:path'
import fse from 'fs-extra'
import defaultTheme from 'tailwindcss/defaultTheme'
import YAML from 'yaml'

/**
 *
 * @param theme Breakpoint theme.
 * @param group Breakpoint group.
 * @param name Breakpoint name.
 * @param multipliers Breakpoint multipliers.
 * @param weight Breakpoint weight.
 * @param size Breakpoint size.
 * @returns Drupal Breakpoint entry.
 */
function getScreen(theme: string, group: string, name: string, multipliers: string[], weight: number, size?: string) {
  return {
    [[theme, group, name].join('.')]: {
      label: name,
      mediaQuery: size
        ? `all and (min-width: ${size})`
        : '',
      weight,
      multipliers: [
        ...multipliers,
      ],
      ...(group && {
        group: `${theme} ${group}`,
      }),
    },
  }
}

/**
 * Applies the `--breakpoint-*` variables of the `@theme` blocks in the
 * theme's `css/tailwind.css` (Tailwind v4) to the default breakpoints.
 *
 * Simple regex parser, no Tailwind internals:
 * - `--breakpoint-<name>: <value>;` adds or overrides a breakpoint.
 * - `--breakpoint-<name>: initial;` removes a breakpoint.
 * - `--breakpoint-*: initial;` removes all default breakpoints.
 *
 * Imported files and nested braces inside `@theme` are not supported.
 *
 * @param breakpoints Default breakpoints.
 * @param root Theme root.
 * @returns Breakpoints.
 */
async function applyThemeBreakpoints(breakpoints: Map<string, string>, root: string) {
  let css: string
  try {
    css = await fs.readFile(path.resolve(root, 'css/tailwind.css'), 'utf-8')
  }
  catch {
    return breakpoints
  }

  css = css.replace(/\/\*[\s\S]*?\*\//g, '')
  for (const [, block] of css.matchAll(/@theme\b[^{]*\{([^}]*)\}/g)) {
    for (const [, name, rawValue] of block.matchAll(/--breakpoint-(\*|[\w-]+)\s*:([^;]+);/g)) {
      const value = rawValue.trim()
      if (name === '*') {
        if (value === 'initial')
          breakpoints.clear()
      }
      else if (value === 'initial') {
        breakpoints.delete(name)
      }
      else {
        breakpoints.set(name, value)
      }
    }
  }
  return breakpoints
}

/**
 * @param size CSS length.
 * @returns Size in px for sorting, Infinity for unsupported units.
 */
function toPx(size: string) {
  const match = size.match(/^(-?[\d.]+)(rem|em|px)$/)
  if (!match)
    return Number.POSITIVE_INFINITY
  return match[2] === 'px'
    ? Number(match[1])
    : Number(match[1]) * 16
}

async function generateBreakpoints(theme: string, multipliers: string[], root: string) {
  const group = 'Tailwind'
  const breakpoints = await applyThemeBreakpoints(
    new Map(Object.entries(defaultTheme.screens ?? {})),
    root,
  )

  // Mobile-first: xs (no media query) first, then ascending by size.
  const sorted = [...breakpoints].sort(([, a], [, b]) => {
    const pxA = toPx(a)
    const pxB = toPx(b)
    return pxA === pxB
      ? 0
      : pxA - pxB
  })

  let screens = {
    ...getScreen(theme, group, 'xs', multipliers, 0),
  }
  sorted.forEach(([name, size], index) => {
    screens = {
      ...screens,
      ...getScreen(theme, group, name, multipliers, index + 1, size),
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
      if (!isWrite || ctx.dev)
        return

      const screens = await generateBreakpoints(ctx.themeName, ctx.options.breakpoints.multipliers, ctx.root)

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

      const screens = await generateBreakpoints(ctx.themeName, ctx.options.breakpoints.multipliers, ctx.root)

      await fse.outputFile(`${config.build.outDir}/${ctx.distThemeName}.breakpoints.yml`, YAML.stringify(screens))
    },
  }
}
