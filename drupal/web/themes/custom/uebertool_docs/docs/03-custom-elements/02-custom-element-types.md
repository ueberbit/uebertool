---
title: 'Vanilla, Lit, Vue & TSX'
description: 'Every flavour of custom element the loader understands.'
---

The loader doesn't care how an element is written. Plain classes, [Lit](https://lit.dev), Vue single file components and TSX all work side by side.

::preview{demo=custom-element-types title="Four flavours, one loader"}

## Vanilla

```ts file=templates/demos/types/hello-vanilla.idle.ce.ts title="hello-vanilla.idle.ce.ts"
```

## Lit

```ts file=templates/demos/types/hello-lit.idle.ce.ts title="hello-lit.idle.ce.ts"
```

:::note
Lit is a peer dependency. Install it in your theme to use it.
:::

## Vue

`.ce.vue` files are wrapped with the plugin's own `defineCustomElement`. Props become attributes, `<slot>` works as usual. See [Vue custom elements](03-vue-custom-elements.md) for styling.

```vue file=templates/demos/types/hello-vue.idle.ce.vue title="hello-vue.idle.ce.vue"
```

## TSX

JSX in `.ce.tsx` files renders with Preact. The plugin sets the JSX import source for the build and in the generated `.uebertool/tsconfig.json`.

```tsx file=templates/demos/types/hello-tsx.idle.ce.tsx title="hello-tsx.idle.ce.tsx"
```

:::note
Preact is a peer dependency. Install it in your theme to use JSX.
:::

## Use in Twig

```twig file=templates/demos/custom-element-types.html.twig
```
