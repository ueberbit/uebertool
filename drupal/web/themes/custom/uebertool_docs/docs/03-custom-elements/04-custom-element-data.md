---
title: 'Editor support'
description: 'Custom element data for VS Code and typed tag names.'
---

On every build start, and whenever a `*.ce.*` file changes, the plugin runs [web-component-analyzer](https://github.com/runem/web-component-analyzer) over `js`, `templates` and `components`. The result gives you tag and attribute completion in Twig and HTML files.

## VS Code

Point VS Code to the generated file:

```json title=".vscode/settings.json"
{
  "html.customData": [
    "web/themes/custom/mytheme/.uebertool/vscode.html-custom-data.json"
  ]
}
```

## Documenting elements

Write a JSDoc comment with an `@element` tag. For Vue files, put it in a `<docs>` block:

```vue
<docs lang="ts">
/**
 * A Vue single file component as custom element.
 *
 * @element demo-hello-vue
 *
 * @attr {string} name - Who to greet.
 *
 * @slot - Appended after the greeting.
 */
</docs>
```

:::caution[@element is required for TypeScript files]
The analyzer only finds classes that are registered with `customElements.define()` or tagged with `@element`. The loader registers the elements at runtime, so add the tag to TS and TSX elements, or they won't show up.
:::

## Generated for this theme

```json file=.uebertool/vscode.html-custom-data.json
```

Vue custom elements are also added to `HTMLElementTagNameMap`, so `document.querySelector('demo-hello-vue')` is typed:

```ts file=.uebertool/custom-elements.d.ts
```
