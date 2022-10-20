import MagicString from 'magic-string'
import type { Plugin } from 'vite'

export default (): Plugin => {
  return {
    name: 'vite-plugin-drupal-tailwind-hmr',
    apply: 'serve',
    transform(code: string, id: string) {
      if (/ce\.vue$/.test(id)) {
        const setupMatch = code.match(/<script.*setup.*>/g)
        if (setupMatch) {
          const importMatch = code.match(/<script.*setup.*>(\n|\r)*import.*\n/g)
          const last = importMatch ? importMatch.at(-1) : false
          const s = new MagicString(code)
          const index = last ? code.indexOf(last) + last.length : code.indexOf(setupMatch[0]) + setupMatch[0].length

          s.appendLeft(index, `
            import { useHMR } from '@ueberbit/vite-plugin-drupal/composables'
            useHMR()
          `)

          return {
            code: s.toString(),
            map: s.generateMap({ hires: true }),
          }
        }
      }

      return code
    },
  }
}
