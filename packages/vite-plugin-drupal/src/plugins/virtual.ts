import type { Plugin } from 'vite'
import type { Context } from './context'
import { resolve } from 'node:path'
import MagicString from 'magic-string'
import { normalizePath } from 'vite'
import { version } from '../../package.json'

const virtualModuleId = 'virtual:uebertool'
const resolvedVirtualModuleId = `\0${virtualModuleId}`
const banner = `Build with UEBERTOOL@${version} https://github.com/ueberbit/uebertool`

const konami = `
const konamiCode = 'ArrowUp,ArrowUp,ArrowDown,ArrowDown,ArrowLeft,ArrowRight,ArrowLeft,ArrowRight,b,a'
let kkeys = []
function konami(e) {
  kkeys.push(e.key)
  if (kkeys.length > 10)
    kkeys.shift()
  if (kkeys.join(',') === konamiCode) {
    document.dispatchEvent(new CustomEvent('konami'))
    kkeys = []
  }
}
window.addEventListener('keydown', konami)
`

export default (ctx: Context): Plugin => {
  const entries = new Set(['js/main.ts', 'js/main.js'].map(file => normalizePath(resolve(ctx.root, file))))

  return {
    name: 'vite-plugin-uebertool-virtual',
    enforce: 'pre',
    transform(src, id) {
      if (entries.has(id.split('?')[0])) {
        const s = new MagicString(src)
        s.prepend('import \'virtual:uebertool\'\n')

        return {
          code: s.toString(),
          map: s.generateMap({ hires: true }),
        }
      }
    },
    async resolveId(id: string) {
      if (id === virtualModuleId)
        return resolvedVirtualModuleId
    },
    async load(id: string) {
      if (id === resolvedVirtualModuleId) {
        const twigHmr = ctx.dev && ctx.options.features.twighmr
          ? 'import \'virtual:twig-hmr\''
          : ''
        const code = `
import 'virtual:vue-ce-loader'
console.log('${banner}')
${konami}
${twigHmr}`.trim()
        return code
      }
    },
  }
}
