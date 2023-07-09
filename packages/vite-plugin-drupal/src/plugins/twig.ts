import type { Plugin } from 'vite'
import type { Context } from './context'

const virtualModuleId = 'virtual:twig-hmr'
const resolvedVirtualModuleId = `\0${virtualModuleId}`

const code = `
if (import.meta.hot) {
  import.meta.hot.on('morphdom', async (data) => {
    if (location.href.includes('/iframe.html')) return
    const newHTML = await fetch(location.href).then((res) => res.text())
    const parser = new DOMParser()
    const newDoc = parser.parseFromString(newHTML, 'text/html')
    import('morphdom').then(({ default: morphdom }) => {
      const tailwind = document.querySelector('link[href*="tailwind"]')
      if (tailwind && tailwind instanceof HTMLLinkElement) {
        tailwind.href = tailwind.href
      }
      morphdom(document.body, newDoc.body)
      Drupal.attachBehaviors(document.body, {})
    })
  })
}        
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
