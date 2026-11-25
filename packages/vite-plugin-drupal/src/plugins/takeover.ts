import type { Plugin } from 'vite'
import type { Context } from './context'
import { mkdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:net'
import { hostname } from 'node:os'
import path from 'node:path'
import process from 'node:process'
import { createLogger } from 'vite'

/**
 * Takes over the port of a dev server that is still running for the same
 * theme, e.g. a forgotten `pnpm dev` in another terminal or a ddev daemon.
 *
 * Only processes recorded in our own lockfile are ever signalled, never
 * whatever else happens to listen on the port.
 */

interface Lock {
  pid: number
  port: number
  /** Distinguishes PID namespaces, e.g. the ddev container and the host. */
  host: string
  startedAt: number
}

const GRACEFUL_TIMEOUT_MS = 10_000
const FORCE_TIMEOUT_MS = 1_000
const POLL_INTERVAL_MS = 100

const logger = createLogger()

export default (ctx: Context): Plugin => {
  return {
    name: 'vite-plugin-uebertool-takeover',
    apply: 'serve',
    async configureServer(server) {
      // One lock per port: a server is only ever taken over by one that wants
      // the same port (strictPort is set, so Vite binds exactly this one).
      const port = server.config.server.port ?? 5173
      const lockPath = path.join(ctx.root, `node_modules/.cache/uebertool/vite-${port}.lock`)

      // Runs before Vite binds the port (strictPort would fail otherwise).
      // On server.restart() the lock is our own and this is a no-op.
      await takeOver(lockPath)

      const httpServer = server.httpServer
      if (!httpServer)
        return

      const startedAt = Date.now()
      const release = () => {
        if (readLock(lockPath)?.pid === process.pid)
          tryUnlink(lockPath)
      }

      httpServer.once('listening', () => {
        const address = httpServer.address()
        if (!address || typeof address === 'string')
          return
        writeLock(lockPath, {
          pid: process.pid,
          port: address.port,
          host: hostname(),
          startedAt,
        })
        process.once('exit', release)
      })
      httpServer.once('close', () => {
        process.off('exit', release)
        release()
      })
    },
  }
}

async function takeOver(lockPath: string): Promise<void> {
  const existing = readLock(lockPath)
  if (!existing || existing.pid === process.pid || existing.host !== hostname())
    return

  if (!isProcessAlive(existing.pid) || await isPortFree(existing.port)) {
    clearLock(lockPath, existing)
    return
  }

  logger.info(`[uebertool] Taking over port ${existing.port} from the dev server with PID ${existing.pid}.`, { timestamp: true })

  for (const [signal, timeout] of [
    ['SIGTERM', GRACEFUL_TIMEOUT_MS],
    ['SIGKILL', FORCE_TIMEOUT_MS],
  ] as const) {
    // The PID may have been recycled or the lock replaced while we waited.
    if (!matches(readLock(lockPath), existing))
      return
    try {
      process.kill(existing.pid, signal)
    }
    catch {}
    if (await waitForRelease(existing, timeout)) {
      clearLock(lockPath, existing)
      return
    }
  }

  logger.error(`[uebertool] The dev server with PID ${existing.pid} did not exit, port ${existing.port} is still in use.`, { timestamp: true })
}

function isProcessAlive(pid: number): boolean {
  try {
    process.kill(pid, 0)
    return true
  }
  catch (e) {
    return (e as NodeJS.ErrnoException).code === 'EPERM'
  }
}

function isPortFree(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const probe = createServer()
      .once('error', () => resolve(false))
      .once('listening', () => probe.close(() => resolve(true)))
      .listen(port)
  })
}

async function waitForRelease(lock: Lock, timeout: number): Promise<boolean> {
  const deadline = Date.now() + timeout
  while (Date.now() < deadline) {
    if (!isProcessAlive(lock.pid) && await isPortFree(lock.port))
      return true
    await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS))
  }
  return false
}

function matches(current: Lock | undefined, existing: Lock): boolean {
  return current?.pid === existing.pid
    && current.startedAt === existing.startedAt
    && current.port === existing.port
    && current.host === existing.host
}

/**
 * The lock decides which PID gets signalled, so anything that does not have
 * the exact shape we write is ignored.
 */
function readLock(lockPath: string): Lock | undefined {
  try {
    const raw = JSON.parse(readFileSync(lockPath, 'utf-8'))
    const isInt = (v: unknown, max: number) => Number.isInteger(v) && (v as number) > 0 && (v as number) <= max
    if (isInt(raw?.pid, 2 ** 31 - 1) && isInt(raw.port, 65535) && typeof raw.host === 'string' && Number.isFinite(raw.startedAt)) {
      return {
        pid: raw.pid,
        port: raw.port,
        host: raw.host,
        startedAt: raw.startedAt,
      }
    }
  }
  catch {}
  return undefined
}

/** Write via rename so a reader never sees a half-written lock. */
function writeLock(lockPath: string, lock: Lock): void {
  const tmpPath = `${lockPath}.${process.pid}.tmp`
  try {
    mkdirSync(path.dirname(lockPath), { recursive: true })
    writeFileSync(tmpPath, JSON.stringify(lock, null, 2))
    renameSync(tmpPath, lockPath)
  }
  catch {
    tryUnlink(tmpPath)
  }
}

function clearLock(lockPath: string, existing: Lock): void {
  if (matches(readLock(lockPath), existing))
    tryUnlink(lockPath)
}

function tryUnlink(file: string): void {
  try {
    unlinkSync(file)
  }
  catch {}
}
