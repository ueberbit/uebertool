# Vite Plugin Drupal

## Install

Add it to your theme with:

```sh
pnpm i -D @ueberbit/vite-plugin-drupal
```

## Features
- automagic asset bundling
- batteries included:
  - preconfigured for tailwind and postcss
  - alpinejs is autoinjected when it is used
- breakpoint.yml generation
- automagic generation of libraries.yml
- autodetection of drupal dependencies
- wrapping of tailwind layers in cascade layers
- autoimport of js/ts files (unimport)
- autoimport of vue components (unplugin-vue-components)
- hmr for twig
- hmr of tailwind inside vue custom elements
- automatic import and defining of custom elements for best performance (lazy, idle, eager, visible)

## Usage

### vite.config.ts
```ts
import { defineConfig } from 'vite'
import uebertool from '@ueberbit/vite-plugin-drupal'

export default defineConfig({
  plugins: [
    uebertool()
  ],
})
```

add js/main.ts and css/tailwind.css to your theme and you are good to go.

### Options

All options are optional:

```ts
import type { UserOptions } from '@ueberbit/vite-plugin-drupal'

uebertool({
  breakpoints: { multipliers: ['1x', '2x', '3x'] },
  features: { twighmr: false },
} satisfies UserOptions)
```

| option                   | default                                                 | description                                                     |
|--------------------------|---------------------------------------------------------|-----------------------------------------------------------------|
| `url`                    | `UEBERTOOL_URL`, `DDEV_PRIMARY_URL`, `http://localhost` | origin of the Drupal site, used for dev asset URLs and CORS     |
| `ce.prefix`              | theme name, `ce` without `.info.yml`                    | prefix of custom element tag names                              |
| `breakpoints.multipliers`| `['1x', '2x']`                                          | multipliers of every breakpoint                                 |
| `features.twighmr`       | `true`                                                  | reload the page content on twig changes                         |
| `features.clearCache`    | `'drush cr'`                                            | command run when entrypoints or templates are added or removed  |
| `baseTheme`              | `false`                                                 | `base theme` of the generated dist theme                        |
| `themePackage`           | theme name                                              | `package` of the generated dist theme                           |
| `vue`                    |                                                         | options for `@vitejs/plugin-vue`                                |
| `unimport`               |                                                         | options for `unimport`                                          |
| `components`             |                                                         | options for `unplugin-vue-components`                           |

Options are deep merged with the defaults, but arrays replace the default
array instead of being appended. `multipliers: ['3x']` results in `3x` only.
To extend a default, repeat it: `multipliers: ['1x', '2x', '3x']`.

### Entrypoints
Every js/ts and css file inside:
```sh
./js
./css
./templates/
```
is an entrypoint and also a drupal library. An exception to this are files inside
```sh
./js/composables
./js/stores
./js/utils
```
, files starting with an _underscore and file ending with `*.ce.*`.

The build output mirrors the source paths: `css/foo.layout.css` becomes
`dist/css/foo.layout.[hash].css`, `js/a/index.ts` becomes
`dist/js/a/index.[hash].js`. Assets referenced from CSS, like images and fonts,
are hashed and placed next to their source as well. Assets from outside the
theme (e.g. `node_modules`) end up in `dist/assets/`.

#### SDC
Drupal automatically attaches the css and js file with the same name as the sdc. Thus you can add the files you want to be transpiled to the assets, src, js or css folder.

The resulting library will be attached by the companion module.

### Custom Element Loader
Files ending with `*.{eager|idle|lazy|visible}.ce.*` are auto injected by the custom element loader.
Any of these files is auto imported and registered as `<themename>-filename`.

| mode    | description                                               |
|---------|-----------------------------------------------------------|
| eager   | imported in main bundle (you most likely don't want this) |
| idle    | dynamic import when browser is idle                       |
| lazy    | dynamic import                                            |
| visible | dynamic import when element is close to the viewport      |

Elements are loaded in parallel. An element that fails to load is logged and
does not stop the others. A tag that is already defined is skipped. Adding or
removing an element file during development reloads the page, no restart
needed.

### Custom Element Data

While the dev server runs, Custom Element Data is exported into .uebertool
(`vite build` only updates `custom-elements.d.ts`).
You can add it to vscode with:

```json
"html.customData": [
  ".uebertool/vscode.html-custom-data.json"
]
```

### CSS

#### Cascade Layers
Tailwind Layers are wrapped in cascade layers by dafault. Drupal styles should be wrapped with
```css
@layer drupal
```
(uebertool_cascade_layer does this for you)

#### Drupal Layers
A css file named `*.{base|layout|component|state|theme}.css` is added to that
Drupal CSS group, e.g. `css/foo.layout.css` is in group `layout`. Without
suffix the group is `base`.

### Breakpoints
The breakpoints.yml uses the Tailwind default breakpoints (`sm` to `2xl`, plus
`xs` without media query). Breakpoints defined in `css/tailwind.css` are
applied on top:

```css
@theme {
  --breakpoint-3xl: 120rem; /* add or override */
  --breakpoint-2xl: initial; /* remove one */
  /* --breakpoint-*: initial; removes all defaults */
}
```

`@import`ed files are not read. Per default every breakpoint offers the 1x and
2x multiplier.

### Libraries
A libraries.yml is automagically generated. Used Drupal dependencies
(`core/drupal`, `core/once`, `core/drupalSettings`, ...) are detected in the
code of the entrypoint and of every chunk it imports, including custom elements.

The library name is derived from the source path:

| source                                    | library                                  |
|-------------------------------------------|------------------------------------------|
| `css/tailwind.css`                        | `css__tailwind`                          |
| `css/foo.layout.css`                      | `css__foo` (group `layout`)              |
| `js/main.ts`                              | `js__main`                               |
| `js/a/index.ts`                           | `js__a__index`                           |
| `templates/components/button/button.ts`   | `button`                                 |
| `components/card/css/card.theme.css`      | `sdc--card` (group `theme`)              |

Files with the same path but a different extension, e.g. `button.ts` and
`button.css`, share one library. Different sources that end up with the same
library name are reported as a warning.

The libraries of:
```sh
./js/main.{ts|js}
./css/tailwind.css
./css/gin-custom.css
```
are global by default, if the file exists.

### Translations
Drupal's locale module only finds `Drupal.t()` and `Drupal.formatPlural()` in
the built entries. Theme sources under `js/`, `templates/` and `components/`
that contain such calls are listed in `dist/translations.json`, in dev and
build. `uebertool_companion` passes them to locale, so strings in custom
elements and in dev are translatable too (after `drush cr`).

### Dev server
- Adding or removing an entrypoint or a twig template restarts the dev server
  and runs `features.clearCache` (`drush cr`). If the command fails, a warning
  is logged.
- CORS only allows the Drupal site (`url`, `UEBERTOOL_URL`,
  `DDEV_PRIMARY_URL`). Without any of them, Vite's default applies.

### Vite DevTools
`@ueberbit/vite-plugin-drupal/devtools` re-exports `DevTools` from
`@vitejs/devtools` and adds two dock entries:

- **Run A11y Check** (`A11yCheckerPlugin`) runs axe-core on the page, lists the
  violations in the messages panel and outlines the offending elements.
- **Drupal Picker** (`DrupalPickerPlugin`) highlights the SDC components and
  Twig templates under the cursor and opens the picked one in the editor. It
  reads the theme debug comments, so it needs
  `parameters.twig.config.debug: true` in `services.yml`. Inside the ddev
  container the browser opens `editorUrl` (default `vscode://file{path}:1`,
  `{path}` is the host path) instead of `$EDITOR`. Set `hostRoot` if the
  project's host path is guessed wrong.

```ts
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

### Types
Drupal types are available. Including types for some internals like drupal/once.
The `virtual:*` modules are typed via `types/virtual`. The option types are
exported:

```ts
import type { DrupalLibrary, UserOptions } from '@ueberbit/vite-plugin-drupal'
```

### Agent skills
The package ships skills for coding agents in `skills/`, e.g.
`uebertool-custom-elements` for writing custom elements and
`uebertool-drupal-libraries` for using Drupal core JS libraries instead of npm
packages. Install them into
your project's agent directories from `node_modules`:
```sh
npx skills experimental_sync
```

### Konami
Do fun stuff with konami code:
```ts
document.addEventListener('konami', funStuff)
```
