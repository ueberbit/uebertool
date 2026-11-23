---
title: 'breakpoints.yml'
description: 'Drupal breakpoints generated from the Tailwind screens.'
---

Responsive image styles need Drupal breakpoints. The plugin writes them to `dist/<theme>_dist.breakpoints.yml`, one per Tailwind screen plus an `xs` breakpoint without a media query.

## Generated for this theme

```yaml file=dist/uebertool_docs_dist.breakpoints.yml
```

## Multipliers

Every breakpoint gets the same multipliers. The default is `1x` and `2x`:

```ts title="vite.config.ts"
uebertool({
  breakpoints: {
    multipliers: ['1x', '2x', '3x'],
  },
})
```

:::caution[Default Tailwind screens only]
The breakpoints come from Tailwind's *default* theme (`tailwindcss/defaultTheme`), not from your stylesheet. Custom `--breakpoint-*` values in your CSS `@theme` are not picked up.
:::

The breakpoint group is called `<theme> Tailwind` and shows up in the responsive image style form.
