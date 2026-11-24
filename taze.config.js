import { defineConfig } from 'taze'

export default defineConfig({
  // Composer manages these. Their package.json and workflow files must not be
  // touched by `pnpm taze-write`.
  ignorePaths: [
    '**/node_modules/**',
    'drupal/vendor/**',
    'drupal/web/core/**',
    'drupal/web/**/contrib/**',
    'drupal/web/libraries/**',
  ],
})
