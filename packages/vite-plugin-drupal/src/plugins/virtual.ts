import type { Plugin } from 'vite'
import type { Context } from './context'
import MagicString from 'magic-string'
import pkg from '../../package.json'

const virtualModuleId = 'virtual:uebertool'
const resolvedVirtualModuleId = `\0${virtualModuleId}`
const fileRegex = /main\.[tj]s$/
const banner = `Build with UEBERTOOL@${pkg.version} https://github.com/ueberbit/uebertool`

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
${ctx.dev && ctx.options.features.twighmr && 'import \'virtual:twig-hmr\''}`.trim()
        return code
      }
    },
  }
}
