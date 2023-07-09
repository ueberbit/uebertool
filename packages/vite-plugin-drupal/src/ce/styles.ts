declare global {
  const __DEV__: boolean
  interface CSSStyleSheet {
    replaceSync(text: string): void
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
export const adoptStyles = (
  renderRoot: ShadowRoot | Document,
  styles: string[] | CSSStyleSheet,
  __hmrId: string | undefined,
) => {
  // If passed a CSSStylesheet just apply it.
  if (styles instanceof CSSStyleSheet) {
    renderRoot.adoptedStyleSheets = [styles]
    return
  }

  const css = styles.join('').replace(/\\\\/g, '\\')

  if (supportsAdoptingStyleSheets) {
    const sheets = renderRoot.adoptedStyleSheets || []
    const oldSheet = __DEV__ && (__hmrId ? sheets.find(sheet => sheet.__hmrId === __hmrId) : false)

    // Check if this StyleSheet exists already. Replace content if it does. Otherwise construct a new CSSStyleSheet.
    if (oldSheet) {
      oldSheet.replaceSync(css)
    }
    else {
      const styleSheet: CSSStyleSheet = new CSSStyleSheet()
      if (__DEV__ && __hmrId)
        styleSheet.__hmrId = __hmrId

      styleSheet.replaceSync(css)
      renderRoot.adoptedStyleSheets = [...(renderRoot.adoptedStyleSheets || []), styleSheet]
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
  @layer base, tailwind-base, tailwind-components, tailwind-utilities;
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
