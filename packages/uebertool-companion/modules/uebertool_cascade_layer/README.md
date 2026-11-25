# UEbertool Cascade Layer

Puts Drupal's aggregated CSS into the `drupal` cascade layer, so theme layers
declared after it win. The layer order itself comes from the base module.

## Functionality

- Wraps every optimized CSS file in `@layer drupal { … }`.
- Moves external `@import` rules in front of the layer block and adds
  `layer(drupal)` to them, because `@import` must come before other rules.

## Aggregation and dev

The decorator hooks into the CSS optimizer, which only runs for aggregated
files. Libraries with `preprocess: false` (e.g. the theme's own build) are never
wrapped.

Browsing the site through the Vite dev server (see vite-plugin-drupal) with
aggregation off, Vite serves Drupal's CSS files and wraps them in
`@layer drupal` if this module is enabled, so the cascade matches production.
Vite asks Drupal with drush, or reads the exported `core.extension.yml`.
