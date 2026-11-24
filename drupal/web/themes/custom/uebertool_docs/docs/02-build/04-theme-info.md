---
title: 'Dist theme'
description: 'The generated *_dist theme that ties the build output to Drupal.'
---

The generated files have to live in an extension Drupal knows about. The plugin therefore creates a hidden theme in `dist/` called `<theme>_dist`, and your theme uses it as base theme.

## Generated for this theme

```yaml file=dist/uebertool_docs_dist.info.yml
```

Your theme only has to point to it:

```yaml title="uebertool_docs.info.yml"
name: 'UEBERTOOL Docs'
type: theme
base theme: uebertool_docs_dist
core_version_requirement: ^11
```

## What it contains

- **Global libraries:** `css__tailwind`, `js__main` and `css__gin-custom` are attached on every page.
- **Base theme:** none (`base theme: false`), so Drupal uses the module templates for everything your theme does not override. Set one with the `baseTheme` option.
- **Package:** the theme name, or the `themePackage` option.
- **Hidden:** it never shows up in the Appearance UI.

:::note
The dist theme is written on `vite build` and when the dev server starts. Run one of them before enabling your theme for the first time, otherwise Drupal cannot find the base theme.
:::
