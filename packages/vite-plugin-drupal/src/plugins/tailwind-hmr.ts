import type { Plugin } from 'vite'
import { injectSetup } from './inject-setup'

export default (): Plugin => {
  return {
    name: 'vite-plugin-uebertool-tailwind-hmr',
    apply: 'serve',
    transform(code: string, id: string) {
      return injectSetup(code, id, 'import { useHMR } from \'@ueberbit/vite-plugin-drupal/composables\';useHMR();')
    },
  }
}
