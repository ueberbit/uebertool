import type { DockClientScriptContext } from '@vitejs/devtools-kit/client'
import type { PickResult, PickTarget } from '../node/types'
import type { Region } from './regions'
import { chainOf, extentOf, scan } from './regions'

const DEVTOOLS_ANCHOR = '#vite-devtools-anchor'
const Z_INDEX = 2147483000

function line(text: string, weight: string, color: string) {
  const el = document.createElement('div')
  el.textContent = text
  el.style.cssText = `font-weight:${weight};color:${color};white-space:nowrap;`
  return el
}

export default function setup(ctx: DockClientScriptContext) {
  // The kit's RPC client is typed against the built-in server functions only,
  // so this plugin's own method needs a widened view of `call`.
  const call = ctx.rpc.call as (name: string, ...args: unknown[]) => Promise<unknown>

  let owners: Map<Element, Region> | null = null
  let hovered: Region | null = null
  let level = 0
  let dirty = false
  let frame = 0

  let root: HTMLDivElement | null = null
  let box: HTMLDivElement | null = null
  let label: HTMLDivElement | null = null
  let cursorStyle: HTMLStyleElement | null = null
  let observer: MutationObserver | null = null

  function active(): Region | null {
    if (!hovered)
      return null
    const ancestors = chainOf(hovered)
    return ancestors[Math.min(level, ancestors.length - 1)]
  }

  function regionAt(x: number, y: number): Region | null {
    const hit = document.elementFromPoint(x, y)
    if (!hit || hit.closest(DEVTOOLS_ANCHOR))
      return null

    if (dirty || !owners) {
      owners = scan()
      dirty = false
    }

    for (let el: Element | null = hit; el; el = el.parentElement) {
      const region = owners.get(el)
      if (region)
        return region
    }
    return null
  }

  function render() {
    if (!box || !label)
      return

    const region = active()
    const extent = region && extentOf(region)
    if (!region || !extent) {
      box.style.display = 'none'
      label.style.display = 'none'
      return
    }

    box.style.display = 'block'
    box.style.top = `${extent.top}px`
    box.style.left = `${extent.left}px`
    box.style.width = `${extent.right - extent.left}px`
    box.style.height = `${extent.bottom - extent.top}px`

    const ancestors = chainOf(hovered!)
    const outer = ancestors.length - 1 - Math.min(level, ancestors.length - 1)
    label.style.display = 'block'
    label.textContent = ''
    label.append(
      line(`${region.badge} ${region.id}`, '600', '#fff'),
      line(
        [
          region.hint,
          outer
            ? `↑ ${outer} more`
            : null,
        ].filter(Boolean).join(' · '),
        '400',
        'rgba(255,255,255,.65)',
      ),
    )

    // Sit above the region unless it is flush with the top of the viewport.
    const height = label.offsetHeight
    label.style.left = `${Math.max(4, extent.left)}px`
    label.style.top = extent.top > height + 8
      ? `${extent.top - height - 4}px`
      : `${extent.bottom + 4}px`
  }

  function schedule() {
    if (frame)
      return
    frame = requestAnimationFrame(() => {
      frame = 0
      render()
    })
  }

  function onMove(event: MouseEvent) {
    const next = regionAt(event.clientX, event.clientY)
    if (next !== hovered) {
      hovered = next
      level = 0
    }
    schedule()
  }

  /** Swallow the interaction so the picked element's own handlers never fire. */
  function swallow(event: Event) {
    event.preventDefault()
    event.stopImmediatePropagation()
  }

  async function open(region: Region) {
    const target: PickTarget = { kind: region.kind, id: region.id }
    void ctx.docks.switchEntry(null)

    try {
      const result = await call('drupal-picker:open', target) as PickResult | null
      // Set when no editor is reachable from the machine running Vite; the
      // browser hands the URL to the OS, which is where the editor lives.
      if (result?.url)
        location.href = result.url
    }
    catch (error) {
      ctx.messages.add({
        level: 'error',
        message: `Could not open ${region.id}`,
        description: error instanceof Error
          ? error.message
          : String(error),
        notify: true,
      })
    }
  }

  function onClick(event: MouseEvent) {
    swallow(event)
    const region = active()
    if (region)
      void open(region)
  }

  function onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      swallow(event)
      void ctx.docks.switchEntry(null)
      return
    }

    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      swallow(event)
      const span = hovered
        ? chainOf(hovered).length - 1
        : 0
      level = Math.min(span, Math.max(0, level + (event.key === 'ArrowUp'
        ? 1
        : -1)))
      schedule()
      return
    }

    if (event.key === 'Enter') {
      swallow(event)
      const region = active()
      if (region)
        void open(region)
    }
  }

  ctx.current.events.on('entry:activated', () => {
    root = document.createElement('div')
    root.style.cssText = `position:fixed;inset:0;pointer-events:none;z-index:${Z_INDEX};`

    box = document.createElement('div')
    box.style.cssText = 'position:fixed;display:none;box-sizing:border-box;'
      + 'background:rgba(97,217,255,.14);outline:1px solid #61d9ff;'
      + 'outline-offset:-1px;border-radius:2px;transition:all .06s ease-out;'

    label = document.createElement('div')
    label.style.cssText = 'position:fixed;display:none;max-width:min(90vw,640px);'
      + 'padding:4px 8px;border-radius:4px;background:#111;box-shadow:0 2px 8px rgba(0,0,0,.35);'
      // The monospace stack has no emoji glyphs, so the marker badge Drupal
      // picked needs the colour-emoji faces appended to show up at all.
      + 'font:12px/1.45 ui-monospace,SFMono-Regular,Menlo,monospace,'
      + '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji";'
      + 'overflow:hidden;text-overflow:ellipsis;'

    root.append(box, label)
    document.body.append(root)

    // `pointer-events:none` on the overlay keeps `elementFromPoint` honest, so
    // the crosshair has to come from a stylesheet instead.
    cursorStyle = document.createElement('style')
    cursorStyle.textContent = `*{cursor:crosshair !important;}`
    document.head.append(cursorStyle)

    owners = scan()
    dirty = false
    if (!owners.size) {
      ctx.messages.add({
        level: 'warn',
        message: 'No Drupal template markers on this page',
        description: 'The picker reads the theme debug comments, so it needs '
          + '`parameters.twig.config.debug: true` in services.yml and a cache '
          + 'rebuild before it can highlight anything.',
        notify: true,
      })
    }

    observer = new MutationObserver(() => {
      dirty = true
    })
    observer.observe(document.documentElement, { childList: true, subtree: true })

    window.addEventListener('mousemove', onMove, true)
    window.addEventListener('click', onClick, true)
    window.addEventListener('pointerdown', swallow, true)
    window.addEventListener('mousedown', swallow, true)
    window.addEventListener('mouseup', swallow, true)
    window.addEventListener('keydown', onKeyDown, true)
    window.addEventListener('scroll', schedule, true)
    window.addEventListener('resize', schedule, true)
  })

  ctx.current.events.on('entry:deactivated', () => {
    window.removeEventListener('mousemove', onMove, true)
    window.removeEventListener('click', onClick, true)
    window.removeEventListener('pointerdown', swallow, true)
    window.removeEventListener('mousedown', swallow, true)
    window.removeEventListener('mouseup', swallow, true)
    window.removeEventListener('keydown', onKeyDown, true)
    window.removeEventListener('scroll', schedule, true)
    window.removeEventListener('resize', schedule, true)

    if (frame) {
      cancelAnimationFrame(frame)
      frame = 0
    }

    observer?.disconnect()
    observer = null
    cursorStyle?.remove()
    cursorStyle = null
    root?.remove()
    root = box = label = null
    owners = null
    hovered = null
    level = 0
  })
}
