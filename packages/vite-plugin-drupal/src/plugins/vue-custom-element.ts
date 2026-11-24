import type { Plugin } from 'vite'
import { injectSetup } from './inject-setup'

export default (): Plugin => {
  return {
    name: 'vite-plugin-uebertool-custom-element-styles',
    transform(code: string, id: string) {
      if (/vue&type=docs/.test(id))
        return 'export default {}'

      return injectSetup(code, id, 'import { useStyles } from \'@ueberbit/vite-plugin-drupal/composables\';useStyles();')
    },
  }
}
