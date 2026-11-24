---
title: 'Stylelint'
description: 'Lint CSS and Tailwind v4 stylesheets with @ueberbit/stylelint-config.'
---

`@ueberbit/stylelint-config` extends [stylelint-config-standard](https://github.com/stylelint/stylelint-config-standard) and orders properties with [stylelint-config-recess-order](https://github.com/stormwarning/stylelint-config-recess-order). It understands Tailwind v4 at-rules and functions and adds rules for Tailwind stylesheets.

## Install

```sh
pnpm add -D @ueberbit/stylelint-config
```

## Configure

```json title=".stylelintrc"
{
  "extends": "@ueberbit/stylelint-config"
}
```

Any other [config file](https://stylelint.io/user-guide/configure) works too, e.g. a `stylelint` key in the `package.json` or a `stylelint.config.js`.

```json title="package.json"
{
  "scripts": {
    "lint:css": "stylelint \"**/*.css\" --cache",
    "lint:css:fix": "stylelint \"**/*.css\" --cache --fix"
  }
}
```

## Conventions

- Class names are BEM in kebab case: `card`, `card__title`, `card--large`, `card__title--small`.
- Inside a rule: `$variables`, custom properties, declarations, `@apply`, nested rules, then other at-rules.
- `@import` uses a string, not `url()`.
- `no-descending-specificity` is off.

## Tailwind

Tailwind at-rules (`@theme`, `@utility`, `@variant`, `@custom-variant`, `@source`, `@reference`, `@plugin`, `@config`, `@apply`, …) and the functions `theme()`, `--theme()`, `--spacing()` and `--alpha()` are allowed. Theme namespace resets like `--color-*: initial` are valid custom properties.

These rules only run in Tailwind files, i.e. files that `@import "tailwindcss"` or have a `@reference`:

| Rule | Reports | Fix |
| --- | --- | --- |
| `ueberbit/tailwind-apply-order` | Classes in `@apply` that are not in Tailwind's class order. | Autofix with `--fix`. |
| `ueberbit/tailwind-no-raw-breakpoint` | `@media (min-width: 768px)` | `@variant md { … }` or `theme(--breakpoint-md)` |
| `ueberbit/tailwind-no-v3-at-rule` | `@screen`, `@variants`, `@responsive`, `@tailwind base` | `@variant`, `@utility`, `@import "tailwindcss";` |
| `ueberbit/tailwind-no-v3-theme-path` | `theme(colors.red.500)` | `var(--color-red-500)` or `--theme(--color-red-500)` |
| `ueberbit/tailwind-no-layer-utility` | Classes in `@layer utilities` | `@utility name { … }`, so variants like `hover:` work. |
| `ueberbit/tailwind-no-important` | `block!`, `!block`, `hover:!block` in `@apply` (warning) | Fix the specificity instead. |

`tailwind-apply-order` loads the file's Tailwind setup, or the stylesheet of its `@reference`, to get the class order. If that can't be resolved, e.g. because of a bundler alias, Tailwind's defaults are used, which still order all core utilities correctly.

Turn a rule off like any other:

```json title=".stylelintrc"
{
  "extends": "@ueberbit/stylelint-config",
  "rules": {
    "ueberbit/tailwind-no-important": null
  }
}
```

## Ignored files

Minified files, `dist`, `output`, `public` and `temp` and Drupal's `web/core`, `web/libraries`, `contrib`, `web/profiles` and `web/sites/*/files` are ignored. The patterns are resolved against the current working directory, so run Stylelint from the theme or project root.
