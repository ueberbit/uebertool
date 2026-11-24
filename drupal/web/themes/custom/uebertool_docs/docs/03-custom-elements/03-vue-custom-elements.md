---
title: 'Vue custom elements'
description: 'Tailwind, scoped styles and nested components inside the shadow DOM.'
---

Vue's own `defineCustomElement` leaves out Tailwind. The plugin wraps it with a thin subclass that adopts Tailwind and a few base styles into the shadow root. Everything else (props, events, slots, provide/inject, `useHost()`, HMR) is Vue's own implementation.

::preview{demo=vue-tailwind title="Tailwind inside a Vue custom element"}

```vue file=templates/demos/vue/tailwind-card.idle.ce.vue
```

## Styles in the shadow root

Each Vue custom element adopts three stylesheets into its shadow root:

1. **Base styles:** the layer order, `:host { display: block }`, `box-sizing: border-box` and `[hidden]`.
2. **Tailwind:** the rules of the page's Tailwind stylesheet, the `<link data-uebertool-tailwind>` from the generated library. It is parsed once and shared by all elements as a constructed stylesheet. If the stylesheet has not loaded yet, it is filled in on its `load` event.
3. **Component styles:** the `<style>` blocks of the element, inserted by Vue.

## Nested components

`*.ce.vue` files without a loading strategy are not registered as elements. They are regular components that can be used by name, without an import (here `<DemoBadge>`). Vue injects a nested `*.ce.vue` component's `<style>` into the shadow root of the element it renders in. The plugin also injects a `useStyles()` call into every `*.ce.vue` file. It only does something when such a component renders in a shadow root outside a Vue custom element.

```vue file=templates/demos/vue/DemoBadge.ce.vue
```

## Tailwind HMR

In dev mode a `useHMR()` call is injected as well: when the element updates, it re-reads the Tailwind stylesheet into the shared sheet, which updates all elements at once. Newly used utility classes show up inside the shadow DOM without a reload.

## Good to know

- Any tag containing a dash is treated as a custom element by the Vue template compiler.
- The Options API is disabled in builds. Use `<script setup>`.
- A `<docs>` block is removed from the bundle and only used for [editor support](04-custom-element-data.md).
