import type { Plugin, ViteDevServer } from 'vite'
import type { Context } from './context'
import { execFile } from 'node:child_process'
import fs from 'node:fs'
import { resolve } from 'node:path'
import { promisify } from 'node:util'
import MagicString from 'magic-string'
import { searchForWorkspaceRoot } from 'vite'
import YAML from 'yaml'

/**
 * Docroot folders whose CSS Vite serves to Drupal in dev.
 * `sites/` (settings, generated files) is never served.
 */
const DIRS = [
  'core',
  'modules',
  'profiles',
  'themes',
  'libraries',
]
const DRUPAL_CSS_REGEX = new RegExp(`^/(?:${DIRS.join('|')})/[^?#%]+\\.css$`)
/**
 * Appended to the module ID of a served file. Vite treats `*.module.css` as
 * CSS Modules and renames its classes, Drupal's `*.module.css` are plain CSS.
 */
const ID_SUFFIX = '.drupal.css'
const SERVED_ID_REGEX = /\.drupal\.css(?:\?|$)/
/**
 * Default config sync directory, relative to the docroot.
 */
const CONFIG_SYNC = '../config/sync'
/**
 * Minimum time between two reads of the Drupal state, in ms.
 */
const STATE_TTL = 5000
const CHARSET_REGEX = /@charset\s+(?:"[^"]*"|'[^']*')\s*;/gi
const IMPORT_REGEX = /@import\s+(url\([^)]*\)|"[^"]*"|'[^']*')([^;]*);/gi

/**
 * Serves the CSS of Drupal core, modules and other themes in dev, with HMR.
 *
 * Browsing the site through the dev server (proxy.ts) with aggregation off,
 * the page requests it at its docroot path, e.g.
 * `https://site:5173/core/modules/system/css/components/align.module.css`.
 * If uebertool_cascade_layer is enabled in the exported core.extension.yml,
 * the files are wrapped in the `drupal` cascade layer, like aggregated CSS.
 * Needs the theme inside a `web/` or `docroot/` folder.
 */
export default (ctx: Context): Plugin => {
  // The theme's docroot path is the end of its root, see getThemeBasePath().
  const docroot = ctx.root.endsWith(ctx.themeBasePath)
    ? ctx.root.slice(0, -ctx.themeBasePath.length)
    : undefined

  // Files requested by Drupal. CSS the theme imports from elsewhere in the
  // docroot is not served by this plugin.
  const served = new Set<string>()

  const toFile = (path: string) => {
    if (!docroot || !DRUPAL_CSS_REGEX.test(path) || path.split('/').includes('..'))
      return
    const file = `${docroot}${path}`
    return fs.statSync(file, { throwIfNoEntry: false })?.isFile()
      ? file
      : undefined
  }

  // Served file of a module ID, if it is one.
  const toServed = (id: string) => {
    const file = id.replace(/\?.*$/, '').slice(0, -ID_SUFFIX.length)
    return served.has(file)
      ? file
      : undefined
  }

  // Whether uebertool_cascade_layer is enabled and CSS aggregation is on.
  // Read from Drupal with drush, or from the exported core.extension.yml.
  let layer = false
  let preprocess = false
  let checked = 0
  let checking: Promise<void> | undefined
  const updateState = (server: ViteDevServer) => {
    if (checking || Date.now() - checked < STATE_TTL)
      return checking
    checking = readState(ctx, docroot!, server).then((state) => {
      checked = Date.now()
      if (state.preprocess && !preprocess)
        server.config.logger.warn('[uebertool] CSS aggregation is on, Drupal\'s CSS files are not served by Vite. Run `drush theme:dev on`.', { timestamp: true })
      preprocess = state.preprocess
      if (state.layer === layer)
        return
      layer = state.layer
      // Transform again with or without the layer and reload the page.
      const { moduleGraph, hot } = server.environments.client
      served.forEach(file => moduleGraph.getModulesByFile(`${file}${ID_SUFFIX}`)
        ?.forEach(mod => moduleGraph.invalidateModule(mod)))
      if (served.size)
        hot.send({ type: 'full-reload' })
    }).finally(() => {
      checking = undefined
    })
    return checking
  }

  return {
    name: 'vite-plugin-uebertool-drupal-css',
    apply: 'serve',
    enforce: 'pre',
    config() {
      if (!docroot)
        return
      // Setting fs.allow turns off Vite's default, so keep the workspace root.
      // That root may contain the docroot, so deny sites/ (settings.php,
      // private files). fs.deny replaces Vite's default, so repeat it.
      return {
        server: {
          fs: {
            allow: [
              searchForWorkspaceRoot(ctx.root),
              ...DIRS.map(dir => `${docroot}/${dir}`),
            ],
            deny: [
              '.env',
              '.env.*',
              '*.{crt,pem}',
              '**/.git/**',
              `${docroot}/sites/**`,
            ],
          },
        },
      }
    },
    configureServer(server) {
      if (!docroot)
        return
      // Runs before Vite's base middleware, which only serves URLs below base.
      const base = server.config.base
      server.middlewares.use(async (req, _res, next) => {
        const url = req.url ?? ''
        const path = url.replace(/[?#].*$/, '')
        // Page loads pick up changes of the module list and aggregation.
        if (req.headers.accept?.includes('text/html'))
          updateState(server)
        if (!path.startsWith(base) && toFile(path)) {
          // Wait for the first read, so the first page is layered right.
          if (!checked)
            await updateState(server)
          req.url = `${base}${url.slice(1)}`
        }
        next()
      })
    },
    resolveId(id) {
      const index = id.indexOf('?')
      const path = index === -1
        ? id
        : id.slice(0, index)
      const file = toFile(path)
      if (!file)
        return
      served.add(file)
      return `${file}${ID_SUFFIX}${id.slice(path.length)}`
    },
    load: {
      filter: { id: SERVED_ID_REGEX },
      async handler(id) {
        const file = toServed(id)
        if (!file)
          return
        this.addWatchFile(file)
        return fs.promises.readFile(file, 'utf-8')
      },
    },
    transform: {
      filter: { id: SERVED_ID_REGEX },
      handler(code, id) {
        if (!layer || !toServed(id))
          return
        const s = wrapInLayer(code)
        return {
          code: s.toString(),
          map: s.generateMap({ hires: true }),
        }
      },
    },
    // Vite looks up the modules of a changed file by its path, without the suffix.
    hotUpdate({ file, modules }) {
      if (!served.has(file))
        return
      return [
        ...modules,
        ...this.environment.moduleGraph.getModulesByFile(`${file}${ID_SUFFIX}`) ?? [],
      ]
    },
  }
}

/**
 * Read whether uebertool_cascade_layer is enabled and CSS aggregation is on.
 * Asks Drupal with drush, which includes overrides from settings.php. Without
 * drush, the module list is read from core.extension.yml in the config sync
 * directory.
 * @param ctx Plugin Context
 * @param docroot docroot path
 * @param server dev server
 * @returns the state
 */
async function readState(ctx: Context, docroot: string, server: ViteDevServer): Promise<{ layer: boolean, preprocess: boolean }> {
  const drush = async (name: string, key: string) => {
    const { stdout } = await promisify(execFile)('drush', [
      'config:get',
      name,
      key,
      '--include-overridden',
      '--format=json',
    ], { cwd: ctx.root, timeout: 15000 })
    return JSON.parse(stdout)[`${name}:${key}`]
  }

  try {
    const [modules, preprocess] = await Promise.all([
      drush('core.extension', 'module'),
      drush('system.performance', 'css.preprocess'),
    ])
    return { layer: modules?.uebertool_cascade_layer !== undefined, preprocess: !!preprocess }
  }
  catch {}

  const file = resolve(ctx.root, ctx.options.configSync ?? resolve(docroot, CONFIG_SYNC), 'core.extension.yml')
  try {
    const config = YAML.parse(await fs.promises.readFile(file, 'utf-8'))
    return { layer: config?.module?.uebertool_cascade_layer !== undefined, preprocess: false }
  }
  catch (error) {
    server.config.logger.warn(`[uebertool] Could not read the module list with drush or from ${file}: ${error}`, { timestamp: true })
    return { layer: false, preprocess: false }
  }
}

/**
 * Wrap CSS in `@layer drupal`. `@charset` and `@import` must come first, so
 * they are moved in front of the block, imports get `layer(drupal)`.
 * @param css CSS
 * @returns the wrapped CSS
 */
export function wrapInLayer(css: string): MagicString {
  const s = new MagicString(css)
  let charset = ''
  let imports = ''

  for (const match of css.matchAll(CHARSET_REGEX)) {
    charset ||= match[0]
    s.remove(match.index, match.index + match[0].length)
  }
  for (const match of css.matchAll(IMPORT_REGEX)) {
    const [rule, url, conditions] = match
    imports += /\blayer\b/i.test(conditions)
      ? `@import ${url}${conditions};`
      : `@import ${url} layer(drupal)${conditions};`
    s.remove(match.index, match.index + rule.length)
  }

  return s.prepend(`${charset}${imports}@layer drupal{`).append('}')
}
