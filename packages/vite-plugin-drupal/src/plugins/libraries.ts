import type { Plugin } from 'vite'
import type { Context } from './context'
import fs from 'node:fs/promises'
import path from 'node:path'
import { defu } from 'defu'
import fse from 'fs-extra'
import YAML from 'yaml'

export interface DrupalLibrary {
  version?: string
  header?: boolean
  dependencies?: string[]
  js?: JSPart
  css?: {
    [key in CSSGroup]: CSSPart
  }
}

export interface JSPart {
  [key: string]: {
    type?: 'external' | 'file'
    minified?: boolean
    preprocessed?: boolean
    attributes?: {
      defer?: boolean
      type?: 'module' | string
      crossorigin?: string
      [key: string]: any
    }
    preprocess?: boolean
    noquery?: boolean
  }
}

export interface CSSPart {
  [key: string]: {
    group?: number
    type?: 'external' | 'file'
    weight?: number
    media?: string
    preprocess?: boolean
    preprocessed?: boolean
    noquery?: boolean
    attributes?: Record<string, any>
  }
}

export const cssGroups = ['base', 'layout', 'component', 'state', 'theme'] as const
export type CSSGroup = typeof cssGroups[number]

const deps = [
  [/once(\(|\.)/, 'core/once'],
  [/Drupal\./, 'core/drupal'],
  [/drupalSettings\./, 'core/drupalSettings'],
  [/Drupal\.announce/, 'core/drupal.announce'],
  [/Drupal\.debounce/, 'core/drupal.debounce'],
  [/Drupal\.dialog/, 'core/drupal.dialog'],
  [/Drupal\.(theme\.)?(a|A)jax/, 'core/drupal.ajax'],
  [/Drupal\.debounce/, 'core/drupal.debounce'],
  [/Drupal\.displace/, 'core/drupal.displace'],
  [/Drupal\.Message/, 'core/drupal.message', '$distThemeName/status-messages'],
  [/Drupal\.(theme\.)?(p|P)rogress/, 'core/drupal.progress'],
  [/Cookies\./, 'core/js-cookie'],
  [/FloatingUI(Core|DOM)\./, 'core/internal.floating-ui'],
] as const

export default (ctx: Context): Plugin => {
  const depMap = new Map<string, Set<string>>()

  return {
    name: 'vite-plugin-uebertool-library',
    enforce: 'post',
    generateBundle(_, bundle, isWrite) {
      if (!isWrite || ctx.dev)
        return

      const files = Object.values(bundle)
        .filter(
          assetOrChunk =>
            assetOrChunk.type === 'asset' || (assetOrChunk.type === 'chunk' && assetOrChunk.code !== '\n' && assetOrChunk.isDynamicEntry === false && !assetOrChunk.fileName.match(/^asset/)),
        )
        .map(assetOrChunk => assetOrChunk.fileName)

      files.forEach((file) => {
        const code = 'code' in bundle[file] ? (bundle[file] as any).code : ''
        setDeps(file, code, depMap)
      })

      const libraries = buildLib(files, ctx, depMap)

      emitLib(libraries, ctx)
    },
    async buildStart() {
      if (ctx.prod)
        return

      const files = ctx.resoledConfig.build.rollupOptions.input as string[]

      await Promise.allSettled(files.filter(file => file.match(/\.(jsx?|tsx?|vue|svelte)$/)).map(async (file) => {
        const code = await (await fs.readFile(file, 'utf-8')).toString()
        setDeps(file, code, depMap)
      }))

      const libraries = buildLib(files, ctx, depMap)

      /**
       * Add Vite client in dev.
       */
      ctx.dev && Object.assign(libraries, {
        vite: {
          header: true,
          js: {
            [`${ctx.url}/@vite/client`]: {
              type: 'external',
              attributes: { type: 'module' },
            },
          },
        },
      })
      emitLib(libraries, ctx)
    },
  }
}

/**
 * Determine CSS group based on filename.
 * @param filename filename
 * @returns css group
 */
function getCssGroup(filename: string): CSSGroup {
  if (filename.match(/\.layout\.css$/))
    return 'layout'
  if (filename.match(/\.component\.css$/))
    return 'component'
  if (filename.match(/\.theme\.css$/))
    return 'theme'
  if (filename.match(/\.state\.css$/))
    return 'state'
  return 'base'
}

/**
 * Generate CSS portion of library.
 * @param file filepath
 * @param ctx Plugin Context
 * @returns CSS portion of Drupal Library object
 */
function getCssPart(file: string, ctx: Context): DrupalLibrary {
  const group = getCssGroup(file)
  const assetPath = ctx.dev
    ? `${ctx.url}/${file}`
    : `${ctx.themeBasePath}/${ctx.resoledConfig.build.outDir}/${file}`

  return <DrupalLibrary>{
    header: true,
    css: {
      [group]: {
        [assetPath]: {
          type: 'external',
          preprocess: false,
          noquery: true,
          attributes: {
            ...(file.match(/tailwind/)
              ? {
                  crossorigin: 'anonymous',
                }
              : {}),
          },
        },
      },
    },
  }
}

/**
 * Generate JS portion of library.
 * @param file filepath
 * @param ctx Plugin Context
 * @returns JS portion of Drupal Library object
 */
function getJsPart(file: string, ctx: Context): DrupalLibrary {
  const assetPath = ctx.dev
    ? `${ctx.url}/${file}`
    : `${ctx.themeBasePath}/${ctx.resoledConfig.build.outDir}/${file}`

  return <DrupalLibrary> {
    header: true,
    js: {
      [assetPath]: {
        type: ctx.dev ? 'external' : 'file',
        preprocess: false,
        noquery: true,
        minified: true,
        attributes: { type: 'module', crossorigin: {} },
      },
    },
  }
}

/**
 * Build library.
 * @param files Rollup Input files
 * @param ctx Plugin Context
 * @param deps Drupal Dependencies Map
 * @returns Drupal Library object
 */
function buildLib(files: string[], ctx: Context, deps: Map<string, Set<string>>): Record<string, DrupalLibrary> {
  const libraries: Record<string, DrupalLibrary> = {}

  files
    .forEach((file) => {
      const ext = path.parse(file).ext.replace('.', '')

      let name = getLibID(file, ctx)

      if (ext === 'css') {
        const part = getCssPart(file, ctx)
        name = name.replace(/\.(base|layout|component|state|theme)$/, '')
        libraries[name] = defu(part, libraries[name] ?? {})
      }
      else if (ctx.dev || (ctx.prod && ext === 'js')) {
        const part = getJsPart(file, ctx)
        libraries[name] = defu(part, libraries[name] ?? {})
      }
      if (deps.has(file)) {
        const dependencies = libraries[name].dependencies ?? []
        libraries[name].dependencies = Array.from(
          new Set([
            ...dependencies,
            ...Array.from(deps.get(file) ?? []).map((dep) => {
              dep = dep
                .replace('$distThemeName', ctx.distThemeName)
                .replace('$themeName', ctx.themeName)
              return dep
            }),
          ]),
        )
      }
    })
  return libraries
}

/**
 * Write Libraries to file.
 * @param libraries Libraries object
 * @param ctx Plugin Context
 */
function emitLib(libraries: Record<string, DrupalLibrary>, ctx: Context) {
  const yml = YAML.stringify(libraries)
  const json = JSON.stringify(libraries, null, 2)

  fse.outputFileSync(`${ctx.resoledConfig.build.outDir}/libraries.json`, json)
  fse.outputFileSync(`${ctx.resoledConfig.build.outDir}/${ctx.distThemeName}.libraries.yml`, yml)
}

/**
 * Return library ID.
 * @param file file path
 * @param ctx Plugin Context
 * @returns sanitized library ID
 */
function getLibID(file: string, ctx: Context) {
  let { name } = path.parse(file)
  if (ctx.prod) {
    const hash = name.match(/\.([\w-]{8})/)?.at(1)
    if (hash)
      name = name.replace(`.${hash}`, '')
  }
  const match = file.match(/^(css|js)\//)
  if (match)
    name = match[0] + name

  const sdc = file.match(/^components\//)
  if (sdc)
    name = `sdc--${name}`

  name = name.replace(/\//g, '__')
  return name
}

/**
 * Scan code for drupal dependencies.
 * @param file file path
 * @param code code
 * @param depMap dependency map
 */
function setDeps(file: string, code: string, depMap: Map<string, Set<string>>) {
  deps.forEach(([regex, ...libraries]) => {
    if (code.match(regex)) {
      const dep = depMap.get(file)
      for (const library of libraries)
        depMap.set(file, dep ? dep.add(library) : new Set([library]))
    }
  })
}
