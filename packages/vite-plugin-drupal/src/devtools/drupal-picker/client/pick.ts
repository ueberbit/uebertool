import type { DockClientScriptContext } from '@vitejs/devtools-kit/client'
import type { PickResult, PickTarget } from '../node/types'
import type { Region } from './regions'
import { chainOf, extentOf, scan } from './regions'

const DEVTOOLS_ANCHOR = '#vite-devtools-anchor'
const Z_INDEX = 2147483000
/** How many tags the element breadcrumb shows before eliding the rest. */
const CRUMBS = 5
const GAP = 6
const EDGE = 8

// The overlay lives in a shadow root, so neither the page's styles nor the
// crosshair rule below reach it, and its own updates never trip the observer.
const STYLE = `
:host { all: initial; }
.box {
  position: fixed; display: none; box-sizing: border-box; pointer-events: none;
  background: rgba(97,217,255,.14); outline: 1px solid #61d9ff; outline-offset: -1px;
  border-radius: 2px; transition: all .06s ease-out;
}
.label, .panel {
  position: fixed; display: none; box-sizing: border-box;
  background: #111; color: #e5e5e5; box-shadow: 0 2px 8px rgba(0,0,0,.35);
  /* The monospace stack has no emoji glyphs, so the marker badge Drupal picked
     needs the colour-emoji faces appended to show up at all. */
  font: 12px/1.45 ui-monospace, SFMono-Regular, Menlo, monospace,
    "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji";
}
.label {
  pointer-events: none; max-width: min(90vw, 640px); padding: 4px 8px; border-radius: 4px;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.label .hint, .muted { color: rgba(255,255,255,.6); }
.panel {
  pointer-events: auto; width: min(calc(100vw - ${2 * EDGE}px), 460px);
  padding: 6px; border-radius: 8px;
  background: rgba(17,17,17,.75); backdrop-filter: blur(8px);
}
.bar { display: flex; gap: 4px; align-items: center; }
button {
  all: unset; cursor: pointer; padding: 2px 8px; border-radius: 4px;
  border: 1px solid #333; color: #ccc;
}
button:hover:not(:disabled), button:focus-visible, button[aria-pressed="true"] {
  background: #2a2a30; color: #fff;
}
button:disabled { opacity: .4; cursor: default; }
.close { margin-left: auto; border-color: transparent; display: inline-flex; padding: 4px; }
/* A mask, because \`currentColor\` inside a url() image is always black. */
.close::before {
  content: ""; width: 1.2em; height: 1.2em; background: currentColor;
  mask: url("data:image/svg+xml;utf8,%3Csvg viewBox='0 0 256 256' width='1em' height='1em' xmlns='http://www.w3.org/2000/svg' %3E%3Cpath fill='currentColor' d='M205.66 194.34a8 8 0 0 1-11.32 11.32L128 139.31l-66.34 66.35a8 8 0 0 1-11.32-11.32L116.69 128L50.34 61.66a8 8 0 0 1 11.32-11.32L128 116.69l66.34-66.35a8 8 0 0 1 11.32 11.32L139.31 128Z'/%3E%3C/svg%3E") center / contain no-repeat;
}
.row { display: flex; gap: 8px; padding: 6px 4px 0; overflow-wrap: anywhere; }
.row .icon { flex: none; opacity: .6; }
.info { display: none; margin-top: 6px; padding: 6px 4px 0; border-top: 1px solid #333; }
.info.open { display: block; }
.chain button { display: block; width: 100%; box-sizing: border-box; border: 0; padding: 1px 4px; }
.chain button[aria-current="true"] { color: #61d9ff; }
`

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className = '', text = '') {
  const node = document.createElement(tag)
  node.className = className
  node.textContent = text
  return node
}

function button(text: string, title: string, onClick: () => void) {
  const node = el('button', '', text)
  node.type = 'button'
  node.title = title
  node.addEventListener('click', onClick)
  return node
}

/**
 * The tags from the region's markup down to the picked element, the same
 * `div > div` trail the Vue inspector shows.
 */
function crumbsOf(region: Region, target: Element): string {
  const root = region.roots.find(r => r.contains(target)) ?? target
  const tags: string[] = []
  for (let cur: Element | null = target; cur; cur = cur.parentElement) {
    tags.unshift(cur.localName)
    if (cur === root)
      break
  }
  return tags.length > CRUMBS
    ? `… > ${tags.slice(-CRUMBS).join(' > ')}`
    : tags.join(' > ')
}

export default function setup(ctx: DockClientScriptContext) {
  // The kit's RPC client is typed against the built-in server functions only,
  // so this plugin's own method needs a widened view of `call`.
  const call = ctx.rpc.call as (name: string, ...args: unknown[]) => Promise<unknown>

  let owners: Map<Element, Region> | null = null
  let hovered: Region | null = null
  /** The element under the cursor, or the one clicked while locked. */
  let target: Element | null = null
  let level = 0
  /** Set by a click: the selection stays put and the panel replaces the label. */
  let locked = false
  let dirty = false
  let frame = 0

  let host: HTMLDivElement | null = null
  let ui: {
    box: HTMLDivElement
    label: HTMLDivElement
    panel: HTMLDivElement
    parent: HTMLButtonElement
    info: HTMLButtonElement
    path: HTMLSpanElement
    crumbs: HTMLSpanElement
    details: HTMLDivElement
  } | null = null
  /** What the info section was last built for, so it is not rebuilt on scroll. */
  let detailsFor = ''
  let cursorStyle: HTMLStyleElement | null = null
  let observer: MutationObserver | null = null

  function active(): Region | null {
    if (!hovered)
      return null
    const ancestors = chainOf(hovered)
    return ancestors[Math.min(level, ancestors.length - 1)]
  }

  function pick(x: number, y: number): { region: Region, hit: Element } | null {
    const hit = document.elementFromPoint(x, y)
    if (!hit || hit === host || hit.closest(DEVTOOLS_ANCHOR))
      return null

    if (dirty || !owners) {
      owners = scan()
      dirty = false
    }

    for (let cur: Element | null = hit; cur; cur = cur.parentElement) {
      const region = owners.get(cur)
      if (region)
        return { region, hit }
    }
    return null
  }

  function setLevel(next: number) {
    const span = hovered
      ? chainOf(hovered).length - 1
      : 0
    level = Math.min(span, Math.max(0, next))
    schedule()
  }

  function unlock() {
    locked = false
    ui?.info.setAttribute('aria-pressed', 'false')
    ui?.details.classList.remove('open')
    schedule()
  }

  function renderDetails(region: Region, ancestors: Region[]) {
    if (!ui)
      return
    const key = `${ancestors.map(a => a.key).join('|')}#${level}`
    if (key === detailsFor)
      return
    detailsFor = key

    const chain = el('div', 'chain')
    // Outermost first, the way the templates nest in the source.
    for (let i = ancestors.length - 1; i >= 0; i--) {
      const ancestor = ancestors[i]
      const depth = ancestors.length - 1 - i
      const item = button(`${ancestor.badge} ${ancestor.id}`, ancestor.hint, () => setLevel(i))
      item.style.paddingLeft = `${4 + depth * 10}px`
      item.setAttribute('aria-current', String(ancestor === region))
      chain.append(item)
    }

    ui.details.replaceChildren(
      el('div', 'muted', region.hint),
      chain,
    )
  }

  function render() {
    if (!ui)
      return
    const { box, label, panel } = ui

    const region = active()
    const extent = region && extentOf(region)
    if (!region || !extent) {
      box.style.display = label.style.display = panel.style.display = 'none'
      return
    }

    box.style.display = 'block'
    box.style.top = `${extent.top}px`
    box.style.left = `${extent.left}px`
    box.style.width = `${extent.right - extent.left}px`
    box.style.height = `${extent.bottom - extent.top}px`

    const ancestors = chainOf(hovered!)
    const outer = ancestors.length - 1 - Math.min(level, ancestors.length - 1)

    if (!locked) {
      panel.style.display = 'none'
      label.style.display = 'block'
      label.replaceChildren(
        el('div', '', `${region.badge} ${region.id}`),
        el('div', 'hint', [
          region.hint,
          outer
            ? `↑ ${outer} more · click to select`
            : 'click to select',
        ].join(' · ')),
      )
      // Sit above the region unless it is flush with the top of the viewport.
      const height = label.offsetHeight
      label.style.left = `${Math.max(4, extent.left)}px`
      label.style.top = extent.top > height + EDGE
        ? `${extent.top - height - 4}px`
        : `${extent.bottom + 4}px`
      return
    }

    label.style.display = 'none'
    panel.style.display = 'block'
    ui.parent.disabled = !outer
    ui.path.textContent = `${region.badge} ${region.id}`
    ui.crumbs.textContent = target
      ? crumbsOf(region, target)
      : ''
    renderDetails(region, ancestors)

    // Below the region, else above it, else pinned inside the viewport — a
    // page-sized template leaves no room on either side.
    const { offsetWidth: width, offsetHeight: height } = panel
    const below = extent.bottom + GAP
    const above = extent.top - GAP - height
    const top = below + height <= innerHeight - EDGE
      ? below
      : above >= EDGE
        ? above
        : innerHeight - EDGE - height
    panel.style.top = `${Math.max(EDGE, top)}px`
    panel.style.left = `${Math.min(Math.max(EDGE, extent.left), innerWidth - EDGE - width)}px`
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
    if (locked)
      return
    const next = pick(event.clientX, event.clientY)
    if (next?.region !== hovered) {
      hovered = next?.region ?? null
      level = 0
    }
    target = next?.hit ?? null
    schedule()
  }

  /** Whether the event happened on the picker's own panel. */
  function onPanel(event: Event) {
    return !!ui && event.composedPath().includes(ui.panel)
  }

  /** Swallow the interaction so the picked element's own handlers never fire. */
  function swallow(event: Event) {
    if (onPanel(event))
      return
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
    if (onPanel(event))
      return
    swallow(event)

    // The selection stays on the picked element; a click outside the panel
    // ends the picker instead of picking again.
    if (locked) {
      void ctx.docks.switchEntry(null)
      return
    }

    const next = pick(event.clientX, event.clientY)
    if (!next)
      return
    // Keep the level picked with ↑/↓ when clicking the region it was picked on.
    if (next.region !== hovered) {
      hovered = next.region
      level = 0
    }
    target = next.hit
    locked = true
    schedule()
  }

  function onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      swallow(event)
      if (locked)
        unlock()
      else
        void ctx.docks.switchEntry(null)
      return
    }

    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      swallow(event)
      setLevel(level + (event.key === 'ArrowUp'
        ? 1
        : -1))
      return
    }

    // Enter on a focused panel button is that button's own click.
    if (event.key === 'Enter' && !onPanel(event)) {
      swallow(event)
      const region = active()
      if (region)
        void open(region)
    }
  }

  function build() {
    host = document.createElement('div')
    host.style.cssText = `position:fixed;inset:0;pointer-events:none;z-index:${Z_INDEX};`
    const shadow = host.attachShadow({ mode: 'open' })

    const style = el('style', '', STYLE)
    const box = el('div', 'box')
    const label = el('div', 'label')
    const panel = el('div', 'panel')

    const parent = button('↰ Parent', 'Select the enclosing template (↑)', () => setLevel(level + 1))
    const openButton = button('↗ Open', 'Open the template in the editor (Enter)', () => {
      const region = active()
      if (region)
        void open(region)
    })
    const info = button('ⓘ Info', 'Show the theme hook and the template chain', () => {
      const shown = ui!.details.classList.toggle('open')
      info.setAttribute('aria-pressed', String(shown))
      schedule()
    })
    info.setAttribute('aria-pressed', 'false')
    const close = button('', 'Deselect (Esc)', unlock)
    close.classList.add('close')
    close.setAttribute('aria-label', 'Deselect')

    const pathRow = el('div', 'row')
    const path = el('span')
    pathRow.append(el('span', 'icon', '📄'), path)
    const crumbsRow = el('div', 'row')
    const crumbs = el('span')
    crumbsRow.append(el('span', 'icon', '⌥'), crumbs)
    const details = el('div', 'info')

    const bar = el('div', 'bar')
    bar.append(parent, openButton, info, close)
    panel.append(bar, pathRow, crumbsRow, details)
    shadow.append(style, box, label, panel)
    document.body.append(host)

    ui = {
      box,
      label,
      panel,
      parent,
      info,
      path,
      crumbs,
      details,
    }
  }

  ctx.current.events.on('entry:activated', () => {
    build()

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
    host?.remove()
    host = ui = null
    detailsFor = ''
    owners = null
    hovered = target = null
    level = 0
    locked = false
  })
}
