---
title: 'Restart & cache clear'
description: 'New entrypoints restart Vite and clear the Drupal cache.'
---

Adding or deleting a file changes the list of [entrypoints](../02-build/01-entrypoints.md) and therefore the libraries. In dev mode the plugin takes care of it.

## What happens

When a `.css`, `.js`, `.ts` or `.twig` file is **added or removed** (not when one changes), the plugin waits 500&nbsp;ms, then:

1. restarts the Vite dev server, which writes a fresh `libraries.yml`,
2. runs the cache clear command, `drush cr` by default, so Drupal picks up the new libraries and templates.

Files starting with an underscore are ignored.

## Configuration

```ts title="vite.config.ts"
uebertool({
  features: {
    // Any command, split on spaces. `false` disables it.
    clearCache: 'ddev drush cr',
  },
})
```

:::note
The command runs where Vite runs. If Vite runs on your host and Drupal in DDEV, use `ddev drush cr`.
:::
