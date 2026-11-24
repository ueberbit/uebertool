# UEbertool Cascade Layer

Puts Drupal's aggregated CSS into the `drupal` cascade layer, so theme layers
declared after it win. The layer order itself comes from the base module.

## Functionality

- Wraps every optimized CSS file in `@layer drupal { … }`.
- Moves external `@import` rules in front of the layer block and adds
  `layer(drupal)` to them, because `@import` must come before other rules.

## Aggregation only

The decorator hooks into the CSS optimizer, which only runs for aggregated
files. Without aggregation Drupal CSS stays unlayered and beats layered theme
CSS, so check the cascade with aggregation on. Libraries with
`preprocess: false` (e.g. the theme's own build) are never wrapped.
