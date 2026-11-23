---
title: 'Getting started'
description: 'Install the plugin and build your first Drupal theme with Vite.'
---

`@ueberbit/vite-plugin-drupal` turns [Vite](https://vite.dev) into a Drupal theme build tool. It bundles your assets, generates the `*.libraries.yml`, `*.breakpoints.yml` and a `*_dist` theme, registers custom elements by file name and gives you HMR for Twig.

:::tip[This page is the demo]
These docs are rendered by Drupal with the `uebertool_docs` theme, which is built with the plugin itself. Every live preview is real Twig, rendered and hydrated in this Drupal site.
:::

## Install

Add the plugin and Vite to your theme:

```sh
pnpm add -D @ueberbit/vite-plugin-drupal vite
pnpm add tailwindcss alpinejs vue @vueuse/core morphdom
```

:::caution[Install the auto-import presets in your theme]
The auto-import presets are resolved from your theme directory. Without `@vueuse/core` installed in the theme the build fails with `[auto-import] failed to load @vueuse/core`.
:::

## Configure Vite

```ts title="vite.config.ts"
import uebertool from '@ueberbit/vite-plugin-drupal'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    uebertool(),
  ],
})
```

Add the scripts to the theme's `package.json`. The `uebertool` binary generates the TypeScript setup in `.uebertool/` (see [TypeScript](../04-developer-experience/05-types.md)).

```json title="package.json"
{
  "scripts": {
    "dev": "uebertool && vite",
    "build": "uebertool && vite build"
  }
}
```

## Wire up the theme

The build generates a hidden theme called `<theme>_dist` in `dist/`. Use it as base theme so Drupal picks up the generated libraries and breakpoints:

```yaml title="mytheme.info.yml"
name: My theme
type: theme
base theme: mytheme_dist
core_version_requirement: ^11
```

Then add `js/main.ts` and `css/tailwind.css`:

```css title="css/tailwind.css"
@import "tailwindcss";
```

## Companion module

Install `uebertool_companion` and its submodules alongside the theme. Several features depend on it:

- `uebertool_twig_loader` attaches the library of a template automatically (`templates/foo/foo.ts` is attached whenever `foo.html.twig` renders).
- `uebertool_cascade_layer` wraps Drupal's own CSS in `@layer drupal`.
- `uebertool_asset_renderer` prevents Drupal from messing with theme assets.

## Run it

```sh
pnpm dev    # libraries point to the Vite dev server, Twig HMR enabled
pnpm build  # hashed production assets in dist/
drush cr    # after switching between dev and build
```

Both commands rewrite `libraries.yml`. Drupal caches library definitions, so clear the cache whenever you switch between `dev` and `build`.

:::note
In DDEV the dev server URL is taken from `DDEV_PRIMARY_URL`. Outside of DDEV set `UEBERTOOL_URL` or the `url` option.
:::
