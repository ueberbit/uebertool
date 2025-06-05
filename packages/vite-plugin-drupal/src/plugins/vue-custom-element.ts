import type { Plugin } from 'vite'
import MagicString from 'magic-string'

export default (): Plugin => {
  return {
    name: 'vite-plugin-uebertool-custom-element-styles',
    transform(code: string, id: string) {
      if (/vue&type=docs/.test(id))
        return 'export default {}'
      if (/ce\.vue$/.test(id)) {
        const setupMatch = code.match(/<script.*setup[^>]*>/g)
        const s = new MagicString(code)

        !setupMatch && s.appendLeft(s.length(), '\n<script setup >import { useStyles } from \'@ueberbit/vite-plugin-drupal/composables\';useStyles();</script>\n')

        if (setupMatch) {
          const index = code.indexOf(setupMatch[0]) + setupMatch[0].length

          s.appendLeft(index, 'import { useStyles } from \'@ueberbit/vite-plugin-drupal/composables\';useStyles();')
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
