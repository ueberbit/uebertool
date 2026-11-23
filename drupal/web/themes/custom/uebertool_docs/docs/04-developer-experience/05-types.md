---
title: 'TypeScript'
description: 'Types for Drupal, drupalSettings and once, plus a generated tsconfig.'
---

The plugin ships types for Drupal's JavaScript API and generates a TypeScript setup for your theme.

## Setup

The `uebertool` binary, which runs before `vite` in the `dev` and `build` scripts, writes `.uebertool/tsconfig.json` and `.uebertool/vite-env.d.ts`. Extend it from your theme:

```json title="tsconfig.json"
{
  "extends": "./.uebertool/tsconfig.json"
}
```

```ts file=.uebertool/vite-env.d.ts
```

## What is typed

- `Drupal`: behaviors, `Drupal.t()`, `Drupal.Message`, … and `drupalSettings`,
- `once()` from `core/once`,
- Vite's `import.meta.env` and `import.meta.hot`,
- `*.vue` imports,
- [auto-imports](01-auto-imports.md) and Vue custom element tag names (`.uebertool/*.d.ts`).

```ts
Drupal.behaviors.accordion = {
  attach(context) {
    once('accordion', '.accordion', context).forEach((element) => {
      element.setAttribute('aria-label', Drupal.t('Accordion'))
    })
  },
}
```

## Generated tsconfig

```json file=.uebertool/tsconfig.json
```

:::note
Add `.uebertool/` to your `.gitignore`. Everything in it is regenerated.
:::
