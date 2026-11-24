import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

let warnedMissingInfo = false

/**
 * Theme machine name from the `*.info.yml` file in cwd, or '' if there is none.
 */
export function getThemeName(): string {
  let name = ''
  try {
    const files = fs.readdirSync(process.cwd())
    const info = files.find(file => file.match(/\.info\.yml$/))
    name = info?.replace('.info.yml', '').toLowerCase() || ''
  }
  catch (e) {
    console.error(`Couldn't read ${process.cwd()}!\n ${e}`)
  }
  if (!name && !warnedMissingInfo) {
    warnedMissingInfo = true
    console.warn(`[uebertool] Couldn't find a .info.yml file in ${process.cwd()}.`)
  }
  return name
}

/**
 * Theme path relative to the Drupal docroot (`web/` or `docroot/`), e.g.
 * `/themes/custom/foo`. Falls back to `/themes/custom/<themeName>`.
 */
export function getThemeBasePath(themeName = getThemeName()): string {
  const cwd = process.cwd()
  for (const docroot of ['/web/', '/docroot/']) {
    const index = cwd.lastIndexOf(docroot)
    if (index !== -1)
      return `/${cwd.slice(index + docroot.length)}`
  }
  return `/themes/custom/${themeName}`
}

export function getDistThemeName(themeName = getThemeName()): string {
  return `${themeName}_dist`
}

export function getNameSpace(name: string) {
  return {
    ...(name && {
      [name]: path.resolve(process.cwd(), 'templates'),
    }),
  }
}
