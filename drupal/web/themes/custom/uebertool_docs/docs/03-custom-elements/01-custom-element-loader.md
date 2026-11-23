---
title: 'Custom element loader'
description: 'Register custom elements by file name: eager, idle, lazy or visible.'
---

Name a file `*.{eager|idle|lazy|visible}.ce.{vue,ts,tsx,js,jsx}` and it becomes a custom element. You don't register it or attach a library. The file name picks the tag name and the loading strategy.

```sh
templates/demos/loader/load-idle.idle.ce.ts   →  <demo-load-idle>
templates/components/card/card.visible.ce.vue →  <mytheme-card>
```

The tag name is `<prefix>-<file name>`. The prefix defaults to the theme name; this theme sets it to `demo` with the `ce.prefix` option.

## Loading strategies

| Mode | When the element is imported and defined |
| --- | --- |
| `eager` | Part of the main bundle, defined immediately. You rarely want this. |
| `idle` | Dynamic import in `requestIdleCallback` (at the latest after 1&nbsp;s). |
| `lazy` | Dynamic import right after the main bundle ran. |
| `visible` | Dynamic import once an instance is within 50% of the viewport. Elements that never show up are never loaded. |

::preview{demo=custom-element-loader title="Loader strategies" iframe height=300}

:::caution[idle and lazy load on every page]
`eager`, `idle` and `lazy` elements are imported on every page that loads `js/main`, whether the tag is used or not. Use `visible` for anything that is not on most pages.
:::

## Exports

`idle`, `lazy` and `visible` modules register their *first* export (or the default export of a `.vue` file). `eager` modules must have a **default** export:

```ts file=templates/demos/loader/load-eager.eager.ce.ts
```

## Requirements

- The loader is injected into `js/main.ts` (or `main.js`), so the theme needs that file.
- `visible` registers `Drupal.behaviors.customElementLoader`, so elements in content added by AJAX are observed too.
