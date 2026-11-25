import type { PickTarget } from '../node/types'

/**
 * Drupal's theme debug output is a flat stream of HTML comments, so a region is
 * the span between a start and an end marker rather than a single element.
 */
export interface Region {
  kind: PickTarget['kind']
  /** SDC plugin id, or the app-root relative Twig path. */
  id: string
  /** `kind:id`, used to pair a start marker with its matching end marker. */
  key: string
  badge: string
  /** Theme hook for templates, a fixed word for components. */
  hint: string
  /** Shallowest elements the region owns directly — the region's own markup. */
  roots: Element[]
  children: Region[]
  parent: Region | null
}

export interface Box { left: number, top: number, right: number, bottom: number }

// `ComponentNodeVisitor` derives the emoji from the plugin id, so it varies per
// component and must not be matched literally.
const COMPONENT_START = /^(\S*)\s*Component start:\s*(\S+)$/
const COMPONENT_END = /^\S*\s*Component end:\s*(\S+)$/
// `TwigThemeEngine` prefixes overridden templates with 💡 and the "CUSTOM
// TEMPLATE" wording, and prints core/contrib templates bare.
const TEMPLATE_START = /^(?:(\S+)\s+)?BEGIN (CUSTOM TEMPLATE )?OUTPUT from '(.+)'$/
const TEMPLATE_END = /^END (?:CUSTOM TEMPLATE )?OUTPUT from '(.+)'$/
const THEME_HOOK = /^THEME HOOK: '(.+)'$/

/** How far to look past a zero-sized element for the box it actually renders. */
const BOX_DEPTH = 4

/**
 * Walks the document once in tree order, pairing the marker comments into a
 * nested region tree and recording which region owns each element. Elements
 * inside a nested region are owned by that inner region, so the innermost
 * region under the cursor is a single map lookup away.
 */
export function scan(): Map<Element, Region> {
  const owners = new Map<Element, Region>()
  const stack: Region[] = []
  let hook = ''

  const walker = document.createTreeWalker(
    document,
    NodeFilter.SHOW_COMMENT | NodeFilter.SHOW_ELEMENT,
  )

  const open = (region: Omit<Region, 'roots' | 'children' | 'parent'>) => {
    const parent = stack[stack.length - 1] ?? null
    const full: Region = {
      ...region,
      roots: [],
      children: [],
      parent,
    }
    parent?.children.push(full)
    stack.push(full)
  }

  const close = (key: string) => {
    for (let i = stack.length - 1; i >= 0; i--) {
      if (stack[i].key === key) {
        stack.length = i
        return
      }
    }
  }

  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const top = stack[stack.length - 1]

    if (node.nodeType === Node.ELEMENT_NODE) {
      if (top) {
        const el = node as Element
        owners.set(el, top)
        // Tree order guarantees the parent was visited first, so a differing
        // owner means this element starts a fresh branch of the region.
        if (owners.get(el.parentElement!) !== top)
          top.roots.push(el)
      }
      continue
    }

    const text = (node as Comment).data.trim()

    const hookMatch = THEME_HOOK.exec(text)
    if (hookMatch) {
      hook = hookMatch[1]
      continue
    }

    const componentStart = COMPONENT_START.exec(text)
    if (componentStart) {
      open({
        kind: 'component',
        id: componentStart[2],
        key: `component:${componentStart[2]}`,
        badge: componentStart[1] || '🧩',
        hint: 'SDC component',
      })
      continue
    }

    const templateStart = TEMPLATE_START.exec(text)
    if (templateStart) {
      open({
        kind: 'template',
        id: templateStart[3],
        key: `template:${templateStart[3]}`,
        badge: templateStart[1] || (templateStart[2] ? '💡' : '📄'),
        hint: hook
          ? `theme hook: ${hook}`
          : 'Twig template',
      })
      hook = ''
      continue
    }

    const componentEnd = COMPONENT_END.exec(text)
    if (componentEnd) {
      close(`component:${componentEnd[1]}`)
      continue
    }

    const templateEnd = TEMPLATE_END.exec(text)
    if (templateEnd)
      close(`template:${templateEnd[1]}`)
  }

  return owners
}

function merge(a: Box | null, b: Box | null): Box | null {
  if (!b)
    return a
  if (!a)
    return b
  return {
    left: Math.min(a.left, b.left),
    top: Math.min(a.top, b.top),
    right: Math.max(a.right, b.right),
    bottom: Math.max(a.bottom, b.bottom),
  }
}

/**
 * An element's on-screen box. SDC hosts are frequently unstyled custom elements
 * that lay out to nothing, so a zero-sized element is measured through its
 * children instead of being treated as invisible.
 */
function boxOf(el: Element, depth: number): Box | null {
  const rect = el.getBoundingClientRect()
  if (rect.width || rect.height)
    return rect

  if (depth >= BOX_DEPTH)
    return null

  let box: Box | null = null
  for (const child of el.children)
    box = merge(box, boxOf(child, depth + 1))
  return box
}

/**
 * The region's on-screen extent. Nested regions are folded in because a
 * template's own markup is often just a wrapper whose children all belong to
 * inner regions, and a Range across the markers would miss any content the
 * layout takes out of flow.
 */
export function extentOf(region: Region): Box | null {
  let box: Box | null = null
  for (const el of region.roots)
    box = merge(box, boxOf(el, 0))
  for (const child of region.children)
    box = merge(box, extentOf(child))
  return box
}

/** The region and its ancestors, innermost first. */
export function chainOf(region: Region): Region[] {
  const out: Region[] = []
  for (let cur: Region | null = region; cur; cur = cur.parent)
    out.push(cur)
  return out
}
