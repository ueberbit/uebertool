import MagicString from 'magic-string'
import type { Plugin } from 'vite'

export default (): Plugin => {
  return {
    name: 'vite-plugin-uebertool-tailwind-hmr',
    apply: 'serve',
    transform(code: string, id: string) {
      if (/ce\.vue$/.test(id)) {
        const setupMatch = code.match(/<script.*setup[^>]*>/g)
        const s = new MagicString(code)

        !setupMatch && s.appendLeft(s.length(), '\n<script setup >import { useHMR } from \'@ueberbit/vite-plugin-drupal/composables\';useHMR();</script>\n')

        if (setupMatch) {
          const index = code.indexOf(setupMatch[0]) + setupMatch[0].length

          s.appendLeft(index, 'import { useHMR } from \'@ueberbit/vite-plugin-drupal/composables\';useHMR();')
        }

        return {
          code: s.toString(),
          map: null,
        }
      }

      return code
    },
  }
}
