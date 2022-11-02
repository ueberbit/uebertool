/// <reference types="vite/client" />
declare module '*.vue' {
  import type { DefineComponent } from 'vue'

  const component: DefineComponent<{}, {}, any>
  export default component
}

declare module 'container-query-polyfill'

declare global {
  interface CSSStyleSheet {
    replaceSync: Function
    __hmrId: string
  }
  interface RenderRoot {
    adoptedStyleSheets: Array<CSSStyleSheet>
  }

  interface ShadowRoot extends RenderRoot {}
  interface Document extends RenderRoot {}
  interface Window {
    sheets: Record<string,CSSStyleSheet>
    styles: Record<string,string>
  }

}
