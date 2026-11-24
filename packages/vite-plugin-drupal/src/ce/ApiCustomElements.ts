import type { VueElementConstructor } from 'vue'
import {
  defineCustomElement as vueDefineCustomElement,
  defineSSRCustomElement as vueDefineSSRCustomElement,
  VueElement,
} from 'vue'
import { adoptSharedStyles } from './styles'

export { VueElement }
export type { VueElementConstructor }

/**
 * Extends a Vue custom element class so that every instance adopts the
 * shared base and Tailwind stylesheets into its shadow root.
 *
 * Everything else (props, events, slots, provide/inject, teleport, HMR and
 * the styles of nested `*.ce.vue` components) is handled by Vue itself.
 */
function withSharedStyles(Base: VueElementConstructor): VueElementConstructor {
  return class extends Base {
    constructor(initialProps?: Record<string, any>) {
      super(initialProps)
      // Vue attaches the shadow root synchronously in its constructor. It is
      // null when the component opts out via `shadowRoot: false`.
      if (this.shadowRoot)
        adoptSharedStyles(this.shadowRoot)
    }
  }
}

/**
 * Vue's `defineCustomElement` with Tailwind and base styles in the shadow root.
 */
export const defineCustomElement = ((options: any, extraOptions?: any) =>
  withSharedStyles(vueDefineCustomElement(options, extraOptions))) as typeof vueDefineCustomElement

/**
 * Vue's `defineSSRCustomElement` with Tailwind and base styles in the shadow root.
 */
export const defineSSRCustomElement = ((options: any, extraOptions?: any) =>
  withSharedStyles(vueDefineSSRCustomElement(options, extraOptions))) as typeof vueDefineSSRCustomElement
