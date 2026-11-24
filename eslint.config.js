import config from '@ueberbit/eslint-config'

export default config({
  ignores: [
    'packages/tailwind/README.md',
    'packages/vite-plugin-drupal/README.md',
    'packages/vite-plugin-drupal/types/drupal.d.ts',
    'packages/drupal-starterkit-theme/**',
    'packages/uebertool-companion/**/*.yml',
    // Composer-managed code and build output are excluded via the .gitignore
    // files. These are tracked but managed by ddev, Drupal or Composer.
    '.ddev/**',
    'drupal/web/sites/**',
    'drupal/config/**',
    'drupal/composer.json',
    'drupal/patches.lock.json',
    // Drupal-exported config and default content, rewritten on every export.
    'drupal/web/**/config/{install,optional,schema}/**',
    'drupal/web/modules/custom/*/content/**',
    // Legacy theme, not a workspace member. It has its own eslint config.
    'drupal/web/themes/custom/ueberbit/**',
    // Code blocks in the docs: snippets and empty `file=…` placeholders that
    // are filled when rendered. Auto-fixing the placeholders breaks their fences.
    'drupal/web/themes/custom/uebertool_docs/docs/**/*.md/**',
  ],
})
