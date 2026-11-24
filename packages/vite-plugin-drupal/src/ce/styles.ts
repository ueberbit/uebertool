declare global {
  const __DEV__: boolean
  interface CSSStyleSheet {
    __hmrId: string
  }
  interface RenderRoot {
    adoptedStyleSheets: Array<CSSStyleSheet>
  }

  interface ShadowRoot extends RenderRoot {}
  interface Document extends RenderRoot {}
}

/**
 * Whether the current browser supports `adoptedStyleSheets`.
 */
export const supportsAdoptingStyleSheets = window.ShadowRoot && 'adoptedStyleSheets' in Document.prototype && 'replaceSync' in CSSStyleSheet.prototype

/**
 * Add constructed Stylesheet or style tag to Shadowroot of VueCE.
 * @param renderRoot The shadowroot of the vueCE..
 * @param styles The styles of the Element.
 * @param __hmrId hmr id of vite used as an UUID.
 */
export function adoptStyles(renderRoot: ShadowRoot | Document, styles: string[] | CSSStyleSheet, __hmrId: string | undefined) {
  // If passed a CSSStylesheet just add it, keeping the already adopted ones.
  if (styles instanceof CSSStyleSheet) {
    if (!renderRoot.adoptedStyleSheets.includes(styles))
      renderRoot.adoptedStyleSheets = [...renderRoot.adoptedStyleSheets, styles]
    return
  }

  const css = styles.join('').replace(/\\\\/g, '\\')

  if (supportsAdoptingStyleSheets) {
    const sheets = renderRoot.adoptedStyleSheets || []
    const oldSheet = __DEV__ && (__hmrId
      ? sheets.find(sheet => sheet.__hmrId === __hmrId)
      : false)

    // Check if this StyleSheet exists already. Replace content if it does. Otherwise construct a new CSSStyleSheet.
    if (oldSheet) {
      oldSheet.replaceSync(css)
    }
    else {
      const styleSheet: CSSStyleSheet = new CSSStyleSheet()
      if (__DEV__ && __hmrId)
        styleSheet.__hmrId = __hmrId

      styleSheet.replaceSync(css)
      renderRoot.adoptedStyleSheets = [
        ...(renderRoot.adoptedStyleSheets || []),
        styleSheet,
      ]
    }
  }
  else {
    const existingStyleElements = renderRoot.querySelectorAll('style')
    const oldStyleElement
      = __DEV__ && (__hmrId
        ? Array.from(existingStyleElements).find(sheet => sheet.title === __hmrId)
        : false)

    // Check if this Style Element exists already. Replace content if it does. Otherwise construct a new HTMLStyleElement.
    if (oldStyleElement) {
      oldStyleElement.textContent = css
    }
    else {
      const styleElement = document.createElement('style')
      if (__DEV__ && __hmrId)
        styleElement.title = __hmrId

      styleElement.textContent = css
      renderRoot instanceof ShadowRoot
        ? renderRoot.appendChild(styleElement)
        : renderRoot.head.appendChild(styleElement)
    }
  }
}

export const baseStyles = `
  @layer properties, theme, base, drupal, components, utilities;
  @layer base {
    :host {
      box-sizing: border-box;
      display: block;
    }
    :host *,
    :host *::before,
    :host *::after {
      box-sizing: inherit;
    }
    [hidden] {
      display: none !important;
    }
  }
`

const isDev = typeof __DEV__ !== 'undefined' && __DEV__

let baseSheet: CSSStyleSheet | undefined
let tailwindSheet: CSSStyleSheet | undefined

/**
 * Read the rules of the page's Tailwind stylesheet.
 * Returns an empty string if it is missing, not loaded yet or not readable
 * (a cross-origin stylesheet without CORS throws on `cssRules`).
 */
function readTailwindCss(link: HTMLLinkElement | null): string {
  if (!link)
    return ''
  try {
    return Array.from(link.sheet?.cssRules ?? [], rule => rule.cssText).join('')
  }
  catch (error) {
    if (isDev)
      console.warn('[uebertool] Cannot read the Tailwind stylesheet for custom elements.', error)
    return ''
  }
}

function findTailwindLink() {
  // The href match is a fallback for themes built with older plugin versions.
  return document.querySelector<HTMLLinkElement>('link[data-uebertool-tailwind]')
    ?? document.querySelector<HTMLLinkElement>('link[rel="stylesheet"][href*="tailwind"]')
}

/**
 * Re-read the page's Tailwind stylesheet into the shared constructed sheet.
 * All custom elements adopt the same sheet object, so they all update.
 */
export function refreshTailwindSheet() {
  const css = readTailwindCss(findTailwindLink())
  if (css && tailwindSheet)
    tailwindSheet.replaceSync(css)
}

function getTailwindSheet() {
  if (tailwindSheet)
    return tailwindSheet

  tailwindSheet = new CSSStyleSheet()
  const link = findTailwindLink()
  const css = readTailwindCss(link)

  if (css) {
    tailwindSheet.replaceSync(css)
  }
  else if (link) {
    // Not loaded yet: fill the shared sheet once it is.
    link.addEventListener('load', refreshTailwindSheet, { once: true })
  }
  else if (isDev) {
    console.warn('[uebertool] No Tailwind stylesheet found, custom elements render without Tailwind.')
  }

  return tailwindSheet
}

function getBaseSheet() {
  if (!baseSheet) {
    baseSheet = new CSSStyleSheet()
    baseSheet.replaceSync(baseStyles)
  }
  return baseSheet
}

/**
 * Adopt the shared base and Tailwind stylesheets into a shadow root.
 * They are prepended, so the layer order of the base styles comes first.
 */
export function adoptSharedStyles(root: ShadowRoot) {
  const shared = [
    getBaseSheet(),
    getTailwindSheet(),
  ]
  root.adoptedStyleSheets = [
    ...shared,
    ...root.adoptedStyleSheets.filter(sheet => !shared.includes(sheet)),
  ]
}
