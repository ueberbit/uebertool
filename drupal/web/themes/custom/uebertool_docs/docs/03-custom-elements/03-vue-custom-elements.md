---
title: 'Vue custom elements'
description: 'Tailwind, scoped styles and nested components inside the shadow DOM.'
---

Vue's own `defineCustomElement` leaves out Tailwind and the styles of nested components. The plugin ships a patched version that fixes both.

::preview{demo=vue-tailwind title="Tailwind inside a Vue custom element"}

```vue file=templates/demos/vue/tailwind-card.idle.ce.vue
```

## Styles in the shadow root

Each Vue custom element adopts three stylesheets into its shadow root:

1. **Base styles:** the layer order, `:host { display: block }`, `box-sizing: border-box` and `[hidden]`.
2. **Tailwind:** the rules of the page's `link[href*="tailwind"]` stylesheet. It is parsed once and shared by all elements as a constructed stylesheet.
3. **Component styles:** the `<style>` blocks of the element.

## Nested components

`*.ce.vue` files without a loading strategy are not registered as elements. They are regular components that can be used by name, without an import (here `<DemoBadge>`). The plugin injects a `useStyles()` call into every `*.ce.vue` file, which copies a nested component's `<style>` into the shadow root it renders in.

```vue file=templates/demos/vue/DemoBadge.ce.vue
```

## Tailwind HMR

In dev mode a `useHMR()` call is injected as well: when the element updates, it re-reads the Tailwind stylesheet. Newly used utility classes show up inside the shadow DOM without a reload.

## Good to know

- Any tag containing a dash is treated as a custom element by the Vue template compiler.
- The Options API is disabled in builds. Use `<script setup>`.
- A `<docs>` block is removed from the bundle and only used for [editor support](04-custom-element-data.md).
