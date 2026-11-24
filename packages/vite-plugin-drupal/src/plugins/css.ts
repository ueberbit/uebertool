import type { Plugin } from 'vite'
import type { Context } from './context'
import MagicString from 'magic-string'

const pattern = /\.css(?:$|\?)/

export default (ctx: Context): Plugin[] => {
  return [
    {
      name: 'vite-plugin-uebertool-public-path-transform',
      transform(src, id) {
        if (!pattern.test(id) || !src.includes('public'))
          return

        const s = new MagicString(src)
        s.replace(/(?<!url\(('|")?)(@|~)\/?public/g, `${ctx.themeBasePath}/public`)

        if (s.hasChanged()) {
          return {
            code: s.toString(),
            map: s.generateMap({ hires: true }),
          }
        }
      },
    },
  ]
}
