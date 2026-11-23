/**
 * Shared base for the loader demos: renders when (relative to navigation
 * start) the element was defined by the custom element loader.
 */
export class LoaderDemo extends HTMLElement {
  static mode = ''

  connectedCallback() {
    const { mode } = this.constructor as typeof LoaderDemo
    this.innerHTML = `
      <div class="flex items-center justify-between gap-4 rounded-lg border border-emerald-600 bg-emerald-50 px-4 py-3 text-emerald-900">
        <code class="font-semibold">&lt;${this.localName}&gt;</code>
        <span>${mode}: defined after <strong>${formatMs(performance.now())}</strong></span>
      </div>`
  }
}
