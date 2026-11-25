---
title: 'Vite DevTools'
description: 'An accessibility audit and a Drupal template picker in Vite DevTools, and port takeover for the dev server.'
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

Highlights the SDC component or Twig template under the cursor. <kbd>↑</kbd> and <kbd>↓</kbd> move to the surrounding or inner template, and <kbd>Enter</kbd> opens the file in your editor. A component whose Twig only extends the `sdc-custom-element` bridge opens its script instead.

Click to select a template. The selection stays put and a panel shows:

- the template's path,
- the tags from the template's markup down to the clicked element, e.g. `div > p`,
- **Parent** to select the surrounding template, and **Open** to open the file,
- **Info** with the theme hook and the whole chain of templates around the selection. Click an entry to select it.

The selection stays on the picked element until you close the panel. Clicking outside the panel leaves the picker. <kbd>Esc</kbd> or the panel's close button clears the selection so you can pick again, and a second <kbd>Esc</kbd> leaves the picker. The file opens at its first line: Drupal's debug output names the template, not the line that printed an element.

The picker reads Drupal's theme debug comments, so Twig debug has to be on:

```yaml title="services.yml"
parameters:
  twig.config:
    debug: true
```

Drupal only prints those comments for templates rendered for a theme hook. To also pick templates pulled in with `{% include %}` or `{% embed %}`, enable `uebertool_twig` from the [companion module](https://github.com/ueberbit/uebertool/tree/main/packages/uebertool-companion). In debug mode it adds the same comments around them, with a 📎 badge, and the picker labels them "included template". SDC components are left out because core already marks them, and so are missing `ignore missing` targets and non-Twig files such as SVGs. Production output does not change.

Outside a container, the file opens in `$EDITOR`. Inside the DDEV web container, Vite cannot reach your editor, so the browser opens an editor URL instead:

```ts title="vite.config.ts"
DrupalPickerPlugin({
  // `{path}` becomes the file's absolute path on the host.
  editorUrl: 'vscode://file{path}:1',
  // Host path of the project. Read from DDEV by default.
  hostRoot: '/home/me/Sites/project',
})
```

## Port Takeover

Part of `uebertool()` itself, no setup needed. If a dev server for the same theme is still running, for example in a forgotten terminal, a new `vite` stops it and takes over its port. Without this, `strictPort` would just fail.

Each dev server records its PID in `node_modules/.cache/uebertool/vite-<port>.lock`. On start, Vite checks the lock for the port it is about to use and sends the server recorded there `SIGTERM`. Servers of the same theme on different ports leave each other alone. If that server has not exited and freed the port after 10 seconds, it gets `SIGKILL`.

Only a server recorded in that lock is ever stopped. Anything else on the port, including a dev server started before this feature existed, is left alone, and Vite fails with `Port … is already in use`. A lock written inside the DDEV container is ignored on the host, and the other way round, because process IDs differ between the two.
