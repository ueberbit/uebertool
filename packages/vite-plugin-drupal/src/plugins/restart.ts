import { spawn } from 'node:child_process'
import path from 'node:path'
import type { Plugin } from 'vite'
import { createLogger } from 'vite'
import type { Context } from './context'

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

  const logger = createLogger()

  return {
    name: 'vite-plugin-uebertool-restart',
    configureServer(server) {
      server.watcher.on('add', handleFileChange)
      server.watcher.on('unlink', handleFileChange)

      function handleFileChange(file: string) {
        if (qualifiedPath(file)) {
          schedule(() => {
            server.restart()

            if (typeof ctx.options.features.clearCache === 'string') {
              const [command, ...args] = ctx.options.features.clearCache.split(' ')
              logger.info(`Running: ${command} ${args.join(' ')}`, { timestamp: true })
              spawn(command, args, { stdio: 'inherit' })
            }
          })
        }
      }

      function qualifiedPath(file: string) {
        const filename = path.basename(file)
        if (filename.startsWith('_'))
          return false
        if (filename.match(/\.(css|js|ts|twig)$/))
          return true
        return false
      }
    },
  }
}
