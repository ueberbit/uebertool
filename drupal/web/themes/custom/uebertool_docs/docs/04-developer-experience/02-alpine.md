---
title: 'Alpine.js'
description: 'Alpine is available everywhere as soon as you use it.'
---

[Alpine.js](https://alpinejs.dev) is [auto-imported](01-auto-imports.md). Use `Alpine` in any script and the import is added for you; the runtime is split into its own `alpine.runtime` chunk. If you never use it, it's not in your bundle.

::preview{demo=alpine title="Alpine store"}

## Register stores, then start

Alpine is not started for you. Register stores, data and plugins first, then call `Alpine.start()`:

```ts title="js/main.ts"
/**
 * Global entrypoint. `Alpine` is auto-imported, `Drupal` is a global.
 */
Alpine.store('darkMode', {
  on: false,
  toggle() {
    this.on = !this.on
  },
})

Alpine.start()

export {}
```

Use it in Twig as usual:

```twig file=templates/demos/alpine.html.twig
```

:::note
Alpine is a peer dependency. Install `alpinejs` (and `@types/alpinejs`) in your theme.
:::
