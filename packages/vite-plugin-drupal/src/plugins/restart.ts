import type { Plugin } from 'vite'
import type { Context } from './context'
import path from 'node:path'

/**
 * Files that change the rollup input set (see config.ts) or the Drupal theme
 * registry. Custom elements are handled by the custom elements plugin.
 */
const INPUT_REGEX = /^(?:(?:js|css|templates)\/.*\.(?:js|jsx|css|scss|ts|tsx)|components\/(?:.*\/)?(?:assets|src|js|css)\/[^/]+\.(?:js|jsx|css|scss|ts|tsx))$/
const TWIG_REGEX = /\.twig$/
const EXCLUDE_REGEX = /\.ce\.|\.stories\.|\.d\.ts$/

export default (ctx: Context): Plugin => {
  let timer: ReturnType<typeof setTimeout> | undefined
  const delay = 500

  function clear() {
    clearTimeout(timer)
  }
  function schedule(fn: () => void) {
    clear()
    timer = setTimeout(fn, delay)
  }

  return {
    name: 'vite-plugin-uebertool-restart',
    configureServer(server) {
      server.watcher.on('add', handleFileChange)
      server.watcher.on('unlink', handleFileChange)

      function handleFileChange(file: string) {
        if (qualifiedPath(file)) {
          // The restarted server rewrites libraries.yml and clears the cache
          // (see the libraries plugin).
          schedule(() => server.restart())
        }
      }

      function qualifiedPath(file: string) {
        const relativePath = path.relative(ctx.root, file).split(path.sep).join('/')
        const filename = path.basename(file)
        if (relativePath.startsWith('..') || filename.startsWith('_'))
          return false
        if (TWIG_REGEX.test(filename))
          return true
        if (EXCLUDE_REGEX.test(filename))
          return false
        return INPUT_REGEX.test(relativePath)
      }
    },
  }
}
