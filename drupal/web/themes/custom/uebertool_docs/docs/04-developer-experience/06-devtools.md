---
title: 'Vite DevTools'
description: 'An accessibility audit and a Drupal template picker in Vite DevTools.'
---

`@ueberbit/vite-plugin-drupal/devtools` re-exports `DevTools` from `@vitejs/devtools` and adds two entries to its dock.

## Setup

```ts title="vite.config.ts"
import uebertool from '@ueberbit/vite-plugin-drupal'
import { A11yCheckerPlugin, DevTools, DrupalPickerPlugin } from '@ueberbit/vite-plugin-drupal/devtools'
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    rolldownOptions: {
      devtools: {},
    },
  },
  plugins: [
    A11yCheckerPlugin(),
    DevTools(),
    DrupalPickerPlugin(),
    uebertool(),
  ],
})
```

## Run A11y Check

Runs [axe-core](https://github.com/dequelabs/axe-core) on the current page and lists each violation in the messages panel, with its WCAG criteria as labels. **Outline** draws boxes around the offending elements; click it again or press <kbd>Esc</kbd> to remove them.

## Drupal Picker

Highlights the SDC component or Twig template under the cursor. <kbd>↑</kbd> and <kbd>↓</kbd> move to the surrounding or inner template. Click or press <kbd>Enter</kbd> to open the file in your editor; <kbd>Esc</kbd> leaves the picker. A component whose Twig only extends the `sdc-custom-element` bridge opens its script instead.

The picker reads Drupal's theme debug comments, so Twig debug has to be on:

```yaml title="services.yml"
parameters:
  twig.config:
    debug: true
```

Outside a container, the file opens in `$EDITOR`. Inside the DDEV web container, Vite cannot reach your editor, so the browser opens an editor URL instead:

```ts title="vite.config.ts"
DrupalPickerPlugin({
  // `{path}` becomes the file's absolute path on the host.
  editorUrl: 'vscode://file{path}:1',
  // Host path of the project. Read from DDEV by default.
  hostRoot: '/home/me/Sites/project',
})
```
