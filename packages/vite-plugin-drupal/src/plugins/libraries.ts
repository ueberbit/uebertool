import type { Plugin, Rolldown } from 'vite'
import type { Context } from './context'
import fs from 'node:fs/promises'
import path, { relative, resolve } from 'node:path'
import { defu } from 'defu'
import fse from 'fs-extra'
import YAML from 'yaml'
import { clearCache } from './clear-cache'
import { DEVTOOLS_LOADER_PATH } from './devtools'

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

export const cssGroups = [
  'base',
  'layout',
  'component',
  'state',
  'theme',
] as const
export type CSSGroup = typeof cssGroups[number]

const deps = [
  [/(?<![.\w$])once(\(|\.)/, 'core/once'],
  [/Drupal\./, 'core/drupal'],
  [/drupalSettings\./, 'core/drupalSettings'],
  [/Drupal\.announce/, 'core/drupal.announce'],
  [/Drupal\.debounce/, 'core/drupal.debounce'],
  [/Drupal\.dialog/, 'core/drupal.dialog'],
  [/Drupal\.(theme\.)?(a|A)jax/, 'core/drupal.ajax'],
  [/Drupal\.displace/, 'core/drupal.displace'],
  [/Drupal\.Message/, 'core/drupal.message', '$distThemeName/status-messages'],
  [/Drupal\.(theme\.)?(p|P)rogress/, 'core/drupal.progress'],
  [/Drupal\.autocomplete/, 'core/drupal.autocomplete'],
  [/Drupal\.theme\.checkbox|Drupal\.theme\(\s*['"]checkbox['"]/, 'core/drupal.checkbox'],
  [/Drupal\.DetailsSummarizedContent/, 'core/drupal.collapse'],
  [/Drupal\.offCanvas/, 'core/drupal.dialog.off_canvas'],
  [/Drupal\.DropButton/, 'core/drupal.dropbutton'],
  [/Drupal\.htmx/, 'core/drupal.htmx'],
  [/Drupal\.states/, 'core/drupal.states'],
  [/Drupal\.tabbingManager/, 'core/drupal.tabbingmanager'],
  [/Drupal\.tableDrag/, 'core/drupal.tabledrag'],
  [/Drupal\.TableResponsive/, 'core/drupal.tableresponsive'],
  [/Drupal\.tableSelect/, 'core/drupal.tableselect'],
  [/Drupal\.timeDiff/, 'core/drupal.time-diff'],
  [/Drupal\.(theme\.)?verticalTab/, 'core/drupal.vertical-tabs'],
  [/(?<![.\w$])htmx\./, 'core/htmx'],
  [/(?<![.\w$])jQuery(\(|\.)/, 'core/jquery'],
  [/(?<![.\w$])loadjs(\(|\.)/, 'core/loadjs'],
  [/(?<![.\w$])Sortable(\(|\.)/, 'core/sortable'],
  [/(?<![.\w$])tabbable\./, 'core/tabbable'],
  [/Cookies\./, 'core/js-cookie'],
  [/FloatingUI(Core|DOM)\./, 'core/internal.floating-ui'],
] as const

const SCRIPT_REGEX = /\.(?:jsx?|tsx?|vue|svelte)$/
const STYLE_REGEX = /\.(?:css|scss|sass|less|styl)$/
const CSS_GROUP_REGEX = /\.(base|layout|component|state|theme)$/
/**
 * Same pattern as the virtual plugin, which injects the custom element loader
 * (uses `Drupal.behaviors`) into these entries.
 */
const MAIN_REGEX = /^js\/main\.[tj]s$/

/**
 * One file of a library.
 * `src` is the root-relative source path (determines ID and CSS group),
 * `out` the path that ends up in the library (dist file in prod).
 */
interface LibFile {
  src: string
  out: string
  kind: 'js' | 'css'
}

type Warn = (message: string) => void

export default (ctx: Context): Plugin => {
  return {
    name: 'vite-plugin-uebertool-library',
    enforce: 'post',
    generateBundle(_, bundle, isWrite) {
      if (!isWrite || ctx.dev)
        return

      const depMap = new Map<string, Set<string>>()
      const files: LibFile[] = []

      for (const output of Object.values(bundle)) {
        if (output.type === 'asset') {
          const src = output.originalFileNames[0]
          // CSS without a source file (imported from JS) is added via its entry chunk.
          if (src && output.fileName.endsWith('.css'))
            files.push({ src, out: output.fileName, kind: 'css' })
          continue
        }

        // Only entries become libraries. CSS entries also emit an empty chunk.
        if (!output.isEntry || !output.facadeModuleId || STYLE_REGEX.test(output.facadeModuleId))
          continue

        const src = relative(ctx.root, output.facadeModuleId)
        files.push({ src, out: output.fileName, kind: 'js' })
        output.viteMetadata?.importedCss.forEach(css => files.push({ src, out: css, kind: 'css' }))

        // Scan the entry and every chunk it imports. Dynamic imports count too:
        // the custom element loader imports elements dynamically and they run
        // on the same page.
        const visited = new Set<string>()
        const scan = (chunk: Rolldown.OutputChunk) => {
          if (visited.has(chunk.fileName))
            return
          visited.add(chunk.fileName)
          setDeps(src, chunk.code, depMap)
          ;[
            ...chunk.imports,
            ...chunk.dynamicImports,
          ].forEach((fileName) => {
            const imported = bundle[fileName]
            if (imported?.type === 'chunk')
              scan(imported)
          })
        }
        scan(output)
      }

      emitLib(buildLib(files, ctx, depMap, msg => this.warn(msg)), ctx)
    },
    async buildStart() {
      if (ctx.prod)
        return

      const { build } = ctx.resolvedConfig
      const input = build.rolldownOptions?.input ?? build.rollupOptions?.input ?? []
      const sources = (typeof input === 'string'
        ? [input]
        : Array.isArray(input)
          ? input
          : Object.values(input))
        .map(file => relative(ctx.root, resolve(ctx.root, file)))

      const depMap = new Map<string, Set<string>>()
      await Promise.allSettled(sources.filter(src => SCRIPT_REGEX.test(src)).map(async (src) => {
        const code = await fs.readFile(resolve(ctx.root, src), 'utf-8')
        setDeps(src, code, depMap)
      }))

      // Vite serves everything but plain CSS as a JS module in dev.
      const files: LibFile[] = sources.map(src => ({
        src,
        out: src,
        kind: src.endsWith('.css')
          ? 'css'
          : 'js',
      }))
      const libraries = buildLib(files, ctx, depMap, msg => this.warn(msg))

      /**
       * Add Vite client in dev.
       */
      Object.assign(libraries, {
        vite: {
          header: true,
          js: {
            [`${ctx.url}${ctx.themeBasePath}/@vite/client`]: {
              type: 'external',
              attributes: { type: 'module' },
            },
            // Vite DevTools injects its dock via transformIndexHtml, which
            // Drupal pages never go through. The loader loads it instead.
            ...(ctx.options.devtools && {
              [`${ctx.url}${DEVTOOLS_LOADER_PATH}`]: {
                type: 'external',
                attributes: { type: 'module' },
              },
            }),
          },
        },
      } satisfies Record<string, DrupalLibrary>)
      emitLib(libraries, ctx)
      // Don't block the dev server start.
      void clearCache(ctx)
    },
    async closeBundle() {
      if (ctx.prod)
        await clearCache(ctx)
    },
  }
}

/**
 * Return the public URL/path of a file in the library.
 * @param file file path (source in dev, dist file in prod)
 * @param ctx Plugin Context
 * @returns asset path
 */
function getAssetPath(file: string, ctx: Context) {
  return ctx.dev
    ? `${ctx.url}${ctx.themeBasePath}/${file}`
    : `${ctx.themeBasePath}/${ctx.resolvedConfig.build.outDir}/${file}`
}

/**
 * Generate CSS portion of library.
 * @param file filepath
 * @param group CSS group
 * @param ctx Plugin Context
 * @returns CSS portion of Drupal Library object
 */
function getCssPart(file: string, group: CSSGroup, ctx: Context): DrupalLibrary {
  return {
    header: true,
    css: {
      [group]: {
        [getAssetPath(file, ctx)]: {
          type: 'external',
          preprocess: false,
          noquery: true,
          attributes: {
            ...(/tailwind/.test(file)
              ? {
                  // Read by Vue custom elements to adopt Tailwind into their
                  // shadow root (see ce/styles.ts).
                  'crossorigin': 'anonymous',
                  'data-uebertool-tailwind': true,
                }
              : {}),
          },
        },
      },
    } as DrupalLibrary['css'],
  }
}

/**
 * Generate JS portion of library.
 * @param file filepath
 * @param ctx Plugin Context
 * @returns JS portion of Drupal Library object
 */
function getJsPart(file: string, ctx: Context): DrupalLibrary {
  return {
    header: true,
    js: {
      [getAssetPath(file, ctx)]: {
        type: ctx.dev ? 'external' : 'file',
        preprocess: false,
        noquery: true,
        minified: true,
        attributes: { type: 'module', crossorigin: 'anonymous' },
      },
    },
  }
}

/**
 * Build library.
 * @param files library files
 * @param ctx Plugin Context
 * @param deps Drupal Dependencies Map (keyed by source path)
 * @param warn warning logger
 * @returns Drupal Library object
 */
function buildLib(files: LibFile[], ctx: Context, deps: Map<string, Set<string>>, warn: Warn): Record<string, DrupalLibrary> {
  const libraries: Record<string, DrupalLibrary> = {}
  // Source paths without extension per ID, and JS sources per ID, to detect collisions.
  const stems = new Map<string, Set<string>>()
  const scripts = new Map<string, Set<string>>()

  files.forEach(({ src, out, kind }) => {
    const { id, group } = getLibID(src)

    const stem = src.replace(/\.[^./]+$/, '').replace(CSS_GROUP_REGEX, '')
    const idStems = stems.get(id) ?? new Set()
    if (!idStems.has(stem) && idStems.size)
      warn(`Library "${id}": "${src}" collides with "${[...idStems].join('", "')}". Rename one of the files.`)
    stems.set(id, idStems.add(stem))

    if (SCRIPT_REGEX.test(src)) {
      const idScripts = scripts.get(id) ?? new Set()
      if (!idScripts.has(src) && idScripts.size)
        warn(`Library "${id}" contains multiple JS entries: "${[...idScripts, src].join('", "')}".`)
      scripts.set(id, idScripts.add(src))
    }

    const part = kind === 'css'
      ? getCssPart(out, group, ctx)
      : getJsPart(out, ctx)
    const library = libraries[id] = defu(part, libraries[id] ?? {})

    const fileDeps = [
      ...(deps.get(src) ?? []),
    ]
    // The virtual plugin injects the custom element loader, which uses Drupal.behaviors.
    if (MAIN_REGEX.test(src))
      fileDeps.push('core/drupal')
    if (fileDeps.length) {
      library.dependencies = [
        ...new Set([
          ...(library.dependencies ?? []),
          ...fileDeps.map(dep => dep
            .replace('$distThemeName', ctx.distThemeName)
            .replace('$themeName', ctx.themeName)),
        ]),
      ]
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

  fse.outputFileSync(`${ctx.resolvedConfig.build.outDir}/libraries.json`, json)
  fse.outputFileSync(`${ctx.resolvedConfig.build.outDir}/${ctx.distThemeName}.libraries.yml`, yml)
}

/**
 * Return library ID and CSS group of a source file. Dev and prod both pass the
 * root-relative source path, so the IDs match.
 *
 * - Extension is dropped; a CSS group suffix (`.base`, `.layout`, `.component`,
 *   `.state`, `.theme`) is dropped too and sets the group (default `base`).
 * - `css/**` and `js/**`: full path, `/` → `__`
 *   (`css/foo.layout.css` → `css__foo` (layout), `js/a/index.ts` → `js__a__index`).
 * - `components/**`: `sdc--<basename>` (`components/x/css/x.css` → `sdc--x`).
 * - anything else (`templates/**`): basename
 *   (`templates/components/button/button.ts` → `button`).
 *
 * Files with the same ID are merged into one library (e.g. `button.ts` and
 * `button.css` next to each other).
 * @param src root-relative source path
 * @returns library ID and CSS group
 */
function getLibID(src: string): { id: string, group: CSSGroup } {
  const { dir, name } = path.parse(src)
  const groupMatch = name.match(CSS_GROUP_REGEX)
  const base = groupMatch
    ? name.slice(0, -groupMatch[0].length)
    : name
  const group = (groupMatch?.[1] ?? 'base') as CSSGroup

  let id = base
  if (/^(?:css|js)(?:\/|$)/.test(dir))
    id = `${dir}/${base}`.replace(/\//g, '__')
  else if (/^components(?:\/|$)/.test(dir))
    id = `sdc--${base}`

  return { id, group }
}

/**
 * Scan code for drupal dependencies.
 * @param src source path
 * @param code code
 * @param depMap dependency map
 */
function setDeps(src: string, code: string, depMap: Map<string, Set<string>>) {
  deps.forEach(([regex, ...libraries]) => {
    if (regex.test(code)) {
      const dep = depMap.get(src) ?? new Set()
      libraries.forEach(library => dep.add(library))
      depMap.set(src, dep)
    }
  })
}
