import type { Plugin } from 'vite'
import MagicString from 'magic-string'
import type { Context } from './context'

const virtualModuleId = 'virtual:uebertool'
const resolvedVirtualModuleId = `\0${virtualModuleId}`
const fileRegex = /main\.(t|j)s$/
const banner = 'Build with UEBERTOOL'

const konami = `
let kkeys = []
function konami(e) {
  kkeys.push(e.key)
  if (kkeys.toString().includes('ArrowUp,ArrowUp,ArrowDown,ArrowDown,ArrowLeft,ArrowRight,ArrowLeft,ArrowRight,b,a')) {
    document.dispatchEvent(new CustomEvent('konami'))
    kkeys = []
  }
}
window.addEventListener('keydown', konami)
`

export default (ctx: Context): Plugin => {
  return {
    name: 'vite-plugin-uebertool-virtual',
    enforce: 'pre',
    transform(src, id) {
      if (fileRegex.test(id)) {
        const s = new MagicString(src)
        s.prepend('import \'virtual:uebertool\'\n')

        return {
          code: s.toString(),
          map: null,
        }
      }
    },
    async resolveId(id: string) {
      if (id === virtualModuleId)
        return resolvedVirtualModuleId
    },
    async load(id: string) {
      if (id === resolvedVirtualModuleId) {
        const code = `
import 'virtual:vue-ce-loader'
console.log('${banner}')
${konami}
${ctx.dev && ctx.options.experimental.twighmr && 'import \'virtual:twig-hmr\''}`.trim()
        return code
      }
    },
  }
}
