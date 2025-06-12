import type { Plugin } from 'vite'
import type { Context } from './context'
import MagicString from 'magic-string'

export default (ctx: Context): Plugin[] => {
  return [
    {
      name: 'vite-plugin-uebertool-public-path-transform',
      transform(src, id) {
        if (/\.css/.test(id)) {
          const s = new MagicString(src)
          s.replace(/(?<!url\(('|")?)(@|~)\/?public/g, `${ctx.themeBasePath}/public`)

          return {
            code: s.toString(),
            map: null,
          }
        }
      },
    },
  ]
}
