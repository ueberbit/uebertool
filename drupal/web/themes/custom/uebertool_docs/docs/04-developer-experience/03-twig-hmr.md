---
title: 'Twig HMR'
description: 'Edit a Twig template and see the change without a reload.'
---

During `pnpm dev`, saving a `.twig` file updates the page in place, with no full reload.

## How it works

1. Vite notices the changed template and sends a `morphdom` event to the browser.
2. The browser fetches the current URL again and diffs the new `<body>` into the page with [morphdom](https://github.com/patrick-steele-idem/morphdom).
3. The Tailwind stylesheet is reloaded, so new utility classes apply right away.
4. `Drupal.attachBehaviors()` runs for the new markup.

::preview{demo=twig-hmr title="Edit templates/demos/twig-hmr.html.twig"}

## Requirements

- `morphdom` installed in your theme.
- A cache clear after starting the dev server, so Drupal loads the assets from Vite.
- Twig cache disabled (*Configuration → Development settings*), otherwise Drupal returns the old markup.
- Your behaviors must be idempotent. Use `once()`, because they run again after every update.

## Running the dev server in DDEV

Start Vite inside the web container, so `DDEV_PRIMARY_URL` is set and the assets are served over HTTPS on the port exposed in `.ddev/config.vite.yml`. Then clear the cache:

```sh
ddev exec -d /var/www/html/drupal/web/themes/custom/uebertool_docs \
  "./node_modules/.bin/uebertool && ./node_modules/.bin/vite"
ddev drush cr
```

Turn it off with:

```ts title="vite.config.ts"
uebertool({
  features: {
    twighmr: false,
  },
})
```

:::note
Pages whose URL contains `/iframe.html` (Storybook) are skipped.
:::
