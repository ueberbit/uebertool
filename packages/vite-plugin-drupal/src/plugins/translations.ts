import type { Plugin } from 'vite'
import type { Context } from './context'
import fs from 'node:fs/promises'
import { relative, resolve } from 'node:path'
import { glob } from 'tinyglobby'

const FILE_NAME = 'translations.json'
const SOURCE_REGEX = /^(?:js|templates|components)\/(?:.+\/)?[^/]+\.(?:[cm]?[jt]sx?|vue)$/
const IGNORE_REGEX = /(?:^|\/)node_modules\/|\.stories\.|\.d\.[cm]?ts$/
// Same as locale's parser (_locale_parse_js_file()), which also needs a
// character in front of `Drupal`.
const TRANSLATABLE_REGEX = /\WDrupal\s*\.\s*(?:t|formatPlural)\s*\(/

/**
 * Lists the theme sources that call Drupal.t() or Drupal.formatPlural() in
 * `translations.json` of the dist theme.
 *
 * Locale only scans library JS of type "file", i.e. the built entries. Chunks
 * loaded with import() (custom elements) are in no library, and in dev all JS
 * is external. uebertool_companion hands the listed sources to locale instead.
 */
export default (ctx: Context): Plugin => {
  const files = new Set<string>()

  /**
   * Add or remove a source file from the list.
   * @param src root-relative source path
   * @returns whether the list changed
   */
  async function update(src: string): Promise<boolean> {
    if (!SOURCE_REGEX.test(src) || IGNORE_REGEX.test(src))
      return false

    let code = ''
    try {
      code = await fs.readFile(resolve(ctx.root, src), 'utf-8')
    }
    catch (error) {
      // A deleted file drops out, other read errors keep the current state.
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT')
        return false
    }
    const translatable = TRANSLATABLE_REGEX.test(code)
    if (translatable === files.has(src))
      return false

    if (translatable)
      files.add(src)
    else
      files.delete(src)
    return true
  }

  function manifest(): string {
    const outDir = resolve(ctx.root, ctx.resolvedConfig.build.outDir)
    return JSON.stringify({
      // Theme root relative to the dist theme, resolved by uebertool_companion.
      root: relative(outDir, ctx.root) || '.',
      files: [...files].sort(),
    }, null, 2)
  }

  async function write() {
    const outDir = resolve(ctx.root, ctx.resolvedConfig.build.outDir)
    await fs.mkdir(outDir, { recursive: true })
    await fs.writeFile(resolve(outDir, FILE_NAME), manifest())
  }

  return {
    name: 'vite-plugin-uebertool-translations',
    async buildStart() {
      files.clear()
      const sources = await glob('{js,templates,components}/**/*', {
        cwd: ctx.root,
        ignore: ['**/node_modules/**'],
      })
      await Promise.all(sources.map(update))
      if (ctx.dev)
        await write()
    },
    generateBundle() {
      if (ctx.prod) {
        this.emitFile({
          type: 'asset',
          fileName: FILE_NAME,
          source: manifest(),
        })
      }
    },
    configureServer(server) {
      const onChange = async (file: string) => {
        if (await update(relative(ctx.root, file)))
          await write()
      }
      server.watcher.on('add', onChange)
      server.watcher.on('change', onChange)
      server.watcher.on('unlink', onChange)
    },
  }
}
