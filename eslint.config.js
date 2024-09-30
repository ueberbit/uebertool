import config from '@ueberbit/eslint-config'

export default config({
  ignores: [
    'packages/tailwind/README.md',
    'packages/vite-plugin-drupal/README.md',
    'packages/vite-plugin-drupal/types/drupal.d.ts',
    'packages/drupal-starterkit-theme/**',
    'packages/uebertool-companion/**/*.yml',
  ],
})
