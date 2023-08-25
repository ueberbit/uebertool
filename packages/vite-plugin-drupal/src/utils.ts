import fs from 'node:fs'
import path from 'node:path'

export const getThemeName = (): string => {
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

export const getThemeBasePath = (): string => {
  return process.cwd().split('/web').at(-1) || `/themes/custom/${getThemeName}`
}

export const getDistThemeName = (): string => {
  return `${getThemeName()}_dist`
}

export const getNameSpace = (name: string) => {
  return {
    ...(name && { [name]: path.resolve(process.cwd(), 'templates') }),
  }
}
