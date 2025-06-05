import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

export function getThemeName(): string {
  let name = ''
  try {
    const files = fs.readdirSync(process.cwd())
    const info = files.find(file => file.match(/\.info\.yml$/))
    name = info?.replace('.info.yml', '').toLowerCase() || '💩'
  }
  catch (e) {
    console.error(`Couldn't find .info.yml file in ${process.cwd()}!\n ${e}`)
  }
  return name
}

export function getThemeBasePath(): string {
  return `/${process.cwd().split('/web/').at(-1)}` || `/themes/custom/${getThemeName}`
}

export function getDistThemeName(): string {
  return `${getThemeName()}_dist`
}

export function getNameSpace(name: string) {
  return {
    ...(name && { [name]: path.resolve(process.cwd(), 'templates') }),
  }
}
