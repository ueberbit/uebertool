---
title: 'Entrypoints'
description: 'Which files are bundled and how they become Drupal libraries.'
---

You never list entrypoints by hand. The plugin globs your theme and every match becomes its own Vite entry and, later, its own Drupal library.

## What is an entrypoint

All `js`, `jsx`, `ts`, `tsx`, `css` and `scss` files in:

```sh
js/**
css/**
templates/**
components/**/{assets,src,js,css}/*
```

Excluded are:

- files starting with an underscore, e.g. `_helpers.ts`,
- custom elements (`*.ce.*`), stories (`*.stories.*`) and declaration files (`*.d.ts`),
- everything in `js/composables`, `js/stores` and `js/utils`. Import those, or let them be [auto-imported](../04-developer-experience/01-auto-imports.md).

:::note
`.vue` files are never entrypoints. Name them `*.ce.vue` to turn them into [custom elements](../03-custom-elements/01-custom-element-loader.md).
:::

## Templates with their own assets

Put a script or stylesheet next to a Twig template and give it the same name. With `uebertool_twig_loader` enabled, the library is attached whenever the template renders – no `attach_library()` needed.

This theme does exactly that for its layout and code blocks:

```sh title="themes/custom/uebertool_docs"
templates/layout/page.html.twig
templates/layout/page.ts                         # library "page"
templates/components/code-block/code-block.html.twig
templates/components/code-block/code-block.ts    # library "code-block"
```

## Single directory components

For SDCs, Drupal attaches the `.css` and `.js` file with the component's name itself. Put the sources you want transpiled into `assets`, `src`, `js` or `css` inside the component folder. Their libraries are prefixed with `sdc--` and attached by the companion module.

## Aliases

These aliases resolve to your theme root and work in JS and CSS:

| Alias | Resolves to |
| --- | --- |
| `~/`, `@/`, `~~/`, `@@/` | theme root |
| `assets/`, `@assets/` | `./assets` |
| `public/`, `@public/` | `./public` |

Vite does not serve the `public` folder in dev and does not copy it to `dist`. Drupal serves it from the theme folder. Imports and `url()` references through the aliases are bundled and hashed. Other references in CSS are rewritten to the theme's `public` path (see [Public assets](05-css.md#public-assets)).

## Output

Production files keep their source directory and get a content hash, e.g. `templates/layout/page.wWm7aee3.js`. The Vue and Alpine runtimes end up in shared chunks (`vue.runtime.esm-browser.prod`, `alpine.runtime`). Font files keep their original name. A Vite manifest is written to `dist/.vite/manifest.json`.

The build also defines `__DEV__` and disables Vue's Options API (`__VUE_OPTIONS_API__: false`), so components must use `<script setup>` or the Composition API.
