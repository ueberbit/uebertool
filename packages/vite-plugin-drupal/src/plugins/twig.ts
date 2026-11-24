import type { Plugin } from 'vite'
import type { Context } from './context'

const virtualModuleId = 'virtual:twig-hmr'
const resolvedVirtualModuleId = `\0${virtualModuleId}`

const code = `
// Server markup of replaced light DOM custom elements, to skip unchanged ones.
const serverHTML = new WeakMap()

// Defined custom elements without shadow root render into their light DOM.
// Morphing would overwrite the rendered children with the server markup, and
// connectedCallback would not run again.
const isLightDomElement = el => el.localName.includes('-') && !el.shadowRoot && !!customElements.get(el.localName)

if (import.meta.hot) {
  import.meta.hot.on('morphdom', async (data) => {
    if (location.href.includes('/iframe.html')) return
    const newHTML = await fetch(location.href).then((res) => res.text())
    const parser = new DOMParser()
    const newDoc = parser.parseFromString(newHTML, 'text/html')
    import('morphdom').then(({ default: morphdom }) => {
      const tailwind = document.querySelector('link[data-uebertool-tailwind]')
        ?? document.querySelector('link[rel="stylesheet"][href*="tailwind"]')
      if (tailwind && tailwind instanceof HTMLLinkElement) {
        const url = new URL(tailwind.href)
        url.search = '?t=' + Date.now()
        tailwind.addEventListener('load', () => {
          document.dispatchEvent(new CustomEvent('uebertool:tailwind-updated'))
        }, { once: true })
        tailwind.href = url.toString()
      }
      const replacements = []
      morphdom(document.body, newDoc.body, {
        onBeforeElUpdated(fromEl, toEl) {
          if (!isLightDomElement(fromEl))
            return true
          // Replace instead of morph, so the element renders again. Done after
          // morphdom finished, to not disturb its traversal.
          if (serverHTML.get(fromEl) !== toEl.outerHTML)
            replacements.push([fromEl, document.importNode(toEl, true), toEl.outerHTML])
          return false
        },
      })
      for (const [oldEl, newEl, html] of replacements) {
        oldEl.replaceWith(newEl)
        serverHTML.set(newEl, html)
      }
      if (typeof Drupal !== 'undefined')
        Drupal.attachBehaviors(document.body)
    })
  })
}\n
`

export default (ctx: Context): Plugin => {
  return {
    name: 'vite-plugin-uebertool-twig',
    enforce: 'pre',
    async resolveId(id: string) {
      if (id === virtualModuleId)
        return resolvedVirtualModuleId
    },
    async load(id: string) {
      if (id === resolvedVirtualModuleId)
        return code
    },
    handleHotUpdate({ file, server }) {
      if (file.endsWith('.twig')) {
        server.ws.send({
          type: 'custom',
          event: 'morphdom',
          data: {
            file: file.replace(ctx.root, ''),
          },
        })
        return []
      }
    },
  }
}
