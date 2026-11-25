import fs from 'node:fs'
import fsp from 'node:fs/promises'
import { basename, dirname, join, relative } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import {
  APP_ROOT_MARKER,
  COMPONENT_GLOBS,
  CUSTOM_ELEMENT_BRIDGE,
  DDEV_APPROOT_LABEL,
  DDEV_COMPOSE_FILE,
  INFO_SUFFIX,
  SCRIPT_EXTENSIONS,
  YML_SUFFIX,
} from './constants'

export async function exists(path: string) {
  return fsp.access(path).then(() => true, () => false)
}

export function resolveClientScript(): string | undefined {
  const paths = [
    // Built: this module is bundled into `dist/devtools/index.mjs`.
    fileURLToPath(new URL('./drupal-picker/client/pick.mjs', import.meta.url)),
    // Source.
    fileURLToPath(new URL('../client/pick.ts', import.meta.url)),
  ]
  return paths.find(path => fs.existsSync(path))
}

/**
 * Drupal's app root — the directory the theme debug comments' paths, and the
 * component globs, are relative to. Vite is started from the theme directory,
 * several levels below it, so it is found by walking up to the nearest
 * `core/lib/Drupal.php`.
 */
export function findAppRoot(from: string): string | null {
  for (let dir = from; ; dir = dirname(dir)) {
    if (fs.existsSync(join(dir, APP_ROOT_MARKER)))
      return dir
    if (dirname(dir) === dir)
      return null
  }
}

/**
 * The extension a component belongs to, found by walking up to the nearest
 * `*.info.yml` — the same rule Drupal's discovery uses. `cache` is keyed by
 * directory so a provider is read from disk once per extension.
 */
export async function findProvider(
  dir: string,
  appRoot: string,
  cache: Map<string, string | null>,
): Promise<string | null> {
  const cached = cache.get(dir)
  if (cached !== undefined)
    return cached

  let provider: string | null = null
  if (dir.startsWith(appRoot) && dir !== appRoot) {
    const entries = await fsp.readdir(dir).catch(() => [] as string[])
    const info = entries.find(entry => entry.endsWith(INFO_SUFFIX))
    provider = info
      ? info.slice(0, -INFO_SUFFIX.length)
      : await findProvider(dirname(dir), appRoot, cache)
  }

  cache.set(dir, provider)
  return provider
}

/**
 * Where `containerRoot` lives on the host, as ddev itself recorded it.
 *
 * ddev stamps the host project path onto every service of the compose file it
 * generates, and mounts that same file into the container — so this is ddev's
 * own answer rather than something inferred from the kernel's view.
 */
async function findDdevHostRoot(containerRoot: string): Promise<string | null> {
  const appRoot = process.env.DDEV_APPROOT
  if (!appRoot || (containerRoot !== appRoot && !containerRoot.startsWith(`${appRoot}/`)))
    return null

  const compose = await fsp.readFile(DDEV_COMPOSE_FILE, 'utf8').catch(() => null)
  const hostRoot = compose && DDEV_APPROOT_LABEL.exec(compose)?.[1]
  return hostRoot
    ? join(hostRoot, relative(appRoot, containerRoot))
    : null
}

/**
 * Where `containerRoot` lives on the machine that started the container.
 *
 * Field 4 of a `/proc/self/mountinfo` line is the mount's root *within its
 * filesystem*, which for a bind-mounted project directory is usually the host
 * path. Only a fallback: on a btrfs- or ZFS-backed home the field names the
 * path inside the subvolume, which is not where the host has it mounted.
 */
async function findMountHostRoot(containerRoot: string): Promise<string | null> {
  const info = await fsp.readFile('/proc/self/mountinfo', 'utf8').catch(() => null)
  if (!info)
    return null

  let best: { mount: string, root: string } | null = null
  for (const line of info.split('\n')) {
    const [, , , root, mount] = line.split(' ')
    if (!root || !mount)
      continue
    if (mount !== '/' && containerRoot !== mount && !containerRoot.startsWith(`${mount}/`))
      continue
    // Longest matching mount point wins, the same rule the kernel resolves by.
    if (!best || mount.length > best.mount.length)
      best = { mount, root }
  }

  if (!best || best.root === '/')
    return null

  return join(best.root, relative(best.mount, containerRoot))
}

/** Where `containerRoot` lives on the host, or `null` if it cannot be told. */
export async function findHostRoot(containerRoot: string): Promise<string | null> {
  return await findDdevHostRoot(containerRoot) ?? await findMountHostRoot(containerRoot)
}

/**
 * The file worth opening for a component: its custom element's script when the
 * Twig only bridges onto one, otherwise the Twig itself.
 */
export async function componentSource(yml: string, name: string) {
  const dir = dirname(yml)
  const twig = join(dir, `${name}.twig`)
  if (!await exists(twig))
    return yml

  // Checked before reading the Twig, so components without a sibling script —
  // nearly everything in core and contrib — cost nothing but a stat.
  let script: string | null = null
  for (const ext of SCRIPT_EXTENSIONS) {
    const candidate = join(dir, `${name}.${ext}`)
    if (await exists(candidate)) {
      script = candidate
      break
    }
  }
  if (!script)
    return twig

  const source = await fsp.readFile(twig, 'utf8').catch(() => '')
  return CUSTOM_ELEMENT_BRIDGE.test(source)
    ? script
    : twig
}

/** Maps `provider:machine-name` to the component's source file. */
export async function buildComponentIndex(appRoot: string) {
  const index = new Map<string, string>()
  const providers = new Map<string, string | null>()

  for (const pattern of COMPONENT_GLOBS) {
    for await (const yml of fsp.glob(`${appRoot}/${pattern}`)) {
      const name = basename(yml, YML_SUFFIX)
      const provider = await findProvider(dirname(yml), appRoot, providers)
      if (!provider)
        continue

      index.set(`${provider}:${name}`, await componentSource(yml, name))
    }
  }

  return index
}
