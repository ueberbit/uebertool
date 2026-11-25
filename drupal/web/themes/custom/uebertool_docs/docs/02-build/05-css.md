---
title: 'CSS & Tailwind'
description: 'Tailwind CSS v4, cascade layers and public asset paths.'
---

Tailwind CSS v4 is built in through `@tailwindcss/vite`. You don't need a PostCSS or Tailwind config file. Import Tailwind in `css/tailwind.css` and you are done.

```css title="css/tailwind.css"
@import "tailwindcss";
```

:::note
Keep `tailwind` in the file name. Vue custom elements look for `link[href*="tailwind"]` to share the stylesheet with their shadow DOM, see [Vue custom elements](../03-custom-elements/03-vue-custom-elements.md).
:::

## Cascade layers

Tailwind v4 puts its styles into the layers `theme`, `base`, `components` and `utilities`. The companion module adds a `drupal` layer and fixes the order in the page `<head>`:

```css
@layer properties, theme, base, drupal, components, components-custom, utilities;
```

`uebertool_cascade_layer` wraps the CSS of Drupal core and modules in `@layer drupal`. As a result, Tailwind utilities always win over Drupal's styles, without `!important`. Vue custom elements declare `properties, theme, base, drupal, components, utilities` in their shadow root.

Drupal only wraps aggregated CSS. In dev, browse the site through Vite instead, e.g. `https://uebertool.localhost:5174/uebertool/`, with aggregation off (`drush theme:dev on`). Vite then serves Drupal's CSS files and wraps them in the same layer if `uebertool_cascade_layer` is enabled. The cascade is the same as in production, and editing a module's CSS updates the page without a reload.

::preview{demo=cascade-layers title="Cascade layers" iframe height=230}

:::caution
Unlayered CSS beats every layer. Put your own non-utility CSS into a layer as well, e.g. `@layer components { … }`.
:::

## Public assets

Inside `url()`, `@public/…` and `~/public/…` are resolved by Vite, so the file is bundled and hashed. Everywhere else in CSS the plugin rewrites them to the absolute path of your theme's `public` folder, e.g. `/themes/custom/mytheme/public`.
