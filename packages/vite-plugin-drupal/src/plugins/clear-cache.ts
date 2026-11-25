import type { Context } from './context'
import { spawn } from 'node:child_process'
import { createLogger } from 'vite'

const logger = createLogger()

/**
 * Run `features.clearCache` (`drush cr`) so Drupal picks up the rewritten
 * libraries.yml and new templates. Resolves when the command exits.
 * @param ctx Plugin Context
 */
export function clearCache(ctx: Context): Promise<void> {
  const { clearCache } = ctx.options.features
  if (typeof clearCache !== 'string')
    return Promise.resolve()

  const [command, ...args] = clearCache.split(' ')
  logger.info(`Running: ${command} ${args.join(' ')}`, { timestamp: true })
  return new Promise((resolve) => {
    spawn(command, args, { stdio: 'inherit', cwd: ctx.root })
      .on('error', (e) => {
        logger.warn(`[uebertool] Failed to run ${command}: ${e.message}`, { timestamp: true })
        resolve()
      })
      .on('close', (code) => {
        if (code)
          logger.warn(`[uebertool] ${command} ${args.join(' ')} exited with code ${code}`, { timestamp: true })
        resolve()
      })
  })
}
