declare global {
  interface ShadowRoot {
    adoptedStyleSheets: Array<CSSStyleSheet>
  }

  interface CSSStyleSheet {
    __hmrId: string
  }
  interface RenderRoot {
    adoptedStyleSheets: Array<CSSStyleSheet>
  }

  interface ShadowRoot extends RenderRoot {}
  interface Document extends RenderRoot {}
}

export {}