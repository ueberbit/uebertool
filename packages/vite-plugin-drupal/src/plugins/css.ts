import type { Plugin } from 'vite'
import MagicString from 'magic-string'
import type { Context } from './context'

const fileRegex = /tailwind\.css/

export default (ctx: Context): Plugin[] => {
  return ctx.options.css?.cascadeLayers
    ? [
        {
          name: 'vite-plugin-uebertool-tailwind-cascade-layers-transform-pre',
          enforce: 'pre',
          transform(src, id) {
            if (fileRegex.test(id)) {
              const s = new MagicString(src)
              s.replace(/@(tailwind) (.*);/g, (_, _$1, $2) => `/*>tailwind-${$2}*/\n@tailwind ${$2};\n/*<tailwind-${$2}*/`)

              return {
                code: s.toString(),
                map: null,
              }
            }
          },
        },
        {
          name: 'vite-plugin-uebertool-tailwind-cascade-layers-transform-post',
          transform(src, id) {
            if (fileRegex.test(id)) {
              const s = new MagicString(src)
              s.replace(/\/\*>(tailwind-.*)\*\//g, (_, $1) => `@layer ${$1} {`)
              s.replace(/\/\*<(tailwind-.*)\*\//g, '}')

              return {
                code: s.toString(),
                map: null,
              }
            }
          },
        },
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
    : []
}
