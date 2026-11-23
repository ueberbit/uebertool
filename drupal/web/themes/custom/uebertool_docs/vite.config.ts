import uebertool from '@ueberbit/vite-plugin-drupal'
import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    // Same port DDEV exposes for the ueberbit theme (.ddev/config.vite.yml).
    port: 5174,
  },
  plugins: [
    uebertool({
      ce: {
        // Custom elements are registered as <demo-*>.
        prefix: 'demo',
      },
    }),
  ],
})
