/**
 * The overlay that marks the elements an axe violation was reported on. Boxes
 * are drawn in the host page (the messages panel lives in its own iframe and
 * cannot reach the app's DOM), positioned in viewport coordinates and
 * repositioned on scroll and resize.
 */

export type OutlineLevel = 'error' | 'warn' | 'info'

export interface OutlineTarget {
  /** The offending element, from axe's `elementRef` output. */
  element: Element
  /** Short caption shown next to the box — the axe rule id. */
  label: string
  level: OutlineLevel
}

// Just below the picker's overlay, so the two never fight over the top layer.
const Z_INDEX = 2147482000

const COLORS: Record<OutlineLevel, { line: string, fill: string }> = {
  error: { line: '#ff6b6b', fill: 'rgba(255,107,107,.14)' },
  warn: { line: '#ffb454', fill: 'rgba(255,180,84,.14)' },
  info: { line: '#61d9ff', fill: 'rgba(97,217,255,.14)' },
}

export interface Outline {
  /**
   * Replace the drawn boxes with `targets`, scrolling the first one into view.
   * Returns how many targets could actually be drawn — a violation on markup
   * that does not render (`<html>` without a lang, a stray `<meta>`) has no box.
   */
  show: (targets: OutlineTarget[]) => number
  clear: () => void
  /** Whether boxes are currently on screen. */
  readonly visible: boolean
}

/** The element's on-screen box, or null when it renders nothing. */
function rectOf(element: Element): DOMRect | null {
  // Elements come from a past audit, so an HTMX swap may have replaced them.
  if (!element.isConnected)
    return null
  const rect = element.getBoundingClientRect()
  return rect.width || rect.height
    ? rect
    : null
}

export function createOutline(): Outline {
  let root: HTMLDivElement | null = null
  let drawn: { target: OutlineTarget, box: HTMLDivElement, label: HTMLDivElement }[] = []
  let frame = 0

  function render() {
    for (const { target, box, label } of drawn) {
      const rect = rectOf(target.element)
      if (!rect) {
        box.style.display = 'none'
        label.style.display = 'none'
        continue
      }

      box.style.display = 'block'
      box.style.top = `${rect.top}px`
      box.style.left = `${rect.left}px`
      box.style.width = `${rect.width}px`
      box.style.height = `${rect.height}px`

      // Sit above the box unless it is flush with the top of the viewport.
      const height = label.offsetHeight
      label.style.display = 'block'
      label.style.left = `${Math.max(2, rect.left)}px`
      label.style.top = rect.top > height + 4
        ? `${rect.top - height - 2}px`
        : `${rect.bottom + 2}px`
    }
  }

  function schedule() {
    if (frame)
      return
    frame = requestAnimationFrame(() => {
      frame = 0
      render()
    })
  }

  function clear() {
    window.removeEventListener('scroll', schedule, true)
    window.removeEventListener('resize', schedule)

    if (frame) {
      cancelAnimationFrame(frame)
      frame = 0
    }

    root?.remove()
    root = null
    drawn = []
  }

  function show(targets: OutlineTarget[]): number {
    clear()

    const container = document.createElement('div')
    container.style.cssText = `position:fixed;inset:0;pointer-events:none;z-index:${Z_INDEX};`

    let first: Element | null = null
    for (const target of targets) {
      if (!rectOf(target.element))
        continue
      first ??= target.element

      const color = COLORS[target.level]
      const box = document.createElement('div')
      box.style.cssText = 'position:fixed;box-sizing:border-box;border-radius:2px;'
        + `background:${color.fill};outline:2px solid ${color.line};outline-offset:-1px;`

      const label = document.createElement('div')
      label.textContent = target.label
      label.style.cssText = 'position:fixed;padding:1px 5px;border-radius:3px;'
        + 'font:11px/1.5 ui-monospace,SFMono-Regular,Menlo,monospace;white-space:nowrap;'
        + `background:${color.line};color:#111;`

      container.append(box, label)
      drawn.push({ target, box, label })
    }

    if (!drawn.length)
      return 0

    root = container
    document.body.append(root)
    render()

    window.addEventListener('scroll', schedule, true)
    window.addEventListener('resize', schedule)

    const rect = first && rectOf(first)
    if (rect && (rect.top < 0 || rect.bottom > window.innerHeight))
      first!.scrollIntoView({ block: 'center', behavior: 'smooth' })

    return drawn.length
  }

  return {
    show,
    clear,
    get visible() {
      return drawn.length > 0
    },
  }
}
