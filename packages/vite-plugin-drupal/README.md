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

### Custom Element Loader
Files ending with `*.{eager|idle|lazy|visible}.ce.*` are auto injected by the custom element loader.
Any of these files is auto imported and registered as `<themename>-filename`.

| mode    | description                                               |
|---------|-----------------------------------------------------------|
| eager   | imported in main bundle (you most likely don't want this) |
| idle    | dynamic import when browser is idle                       |
| lazy    | dynamic import                                            |
| visible | dynamic import when element is close to the viewport      |

### CSS

#### Cascade Layers
Tailwind Layers are wrapped in cascade layers by dafault. Drupal styles should be wrapped with 
```css
@layer drupal
```

You can disable this with:

```ts
css: {
  cascadeLayers: false
}
```

#### Drupal Layers
When a css file include `{base|layout|component|state|theme}` in the name

### Breakpoints
The breakpoint.yml uses the breakpoints from your tailwind config file. Per Default it offers 1x and 2x multiplier.

### Libraries
A libraries.yml is automagically generated. Used Drupal dependencies are added for ease of use.

The libraries of:
```sh
./js/main.{ts|js}
./css/tailwind.css
./css/gin-custom.css
```
Are global by default.

### Types
Drupal types are available. Including types for some internals like drupal/once.

### Konami
Do fun stuff with konami code:
```ts
document.addEventListener('konami', funStuff)
```