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
          const s = new MagicString(code)
          const index = code.indexOf(setupMatch[0]) + setupMatch[0].length

          s.appendLeft(index, 'import { useHMR } from \'@ueberbit/vite-plugin-drupal/composables\';useHMR();')

          return {
            code: s.toString(),
            map: null,
          }
        }
      }

      return code
    },
  }
}
