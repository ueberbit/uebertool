import { defineConfig } from 'vite'
import uebertool from '@ueberbit/vite-plugin-drupal'

export default defineConfig(async () => {
  return {
    plugins: [
      uebertool(),
    ]
  }
})
