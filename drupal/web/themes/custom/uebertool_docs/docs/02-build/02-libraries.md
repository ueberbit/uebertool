---
title: 'libraries.yml'
description: 'Generated Drupal libraries, including detected core dependencies.'
---

Every [entrypoint](01-entrypoints.md) becomes a library in `dist/<theme>_dist.libraries.yml`. The file is written on `vite build` and when the dev server starts.

## Generated for this theme

This is the actual file the plugin generated for the theme you are looking at:

```yaml file=dist/uebertool_docs_dist.libraries.yml
```

## Library names

| Source | Library |
| --- | --- |
| `js/main.ts` | `js__main` |
| `css/tailwind.css` | `css__tailwind` |
| `templates/layout/page.ts` | `page` |
| `components/card/src/card.ts` | `sdc--card` |

Files in `js/` and `css/` are prefixed with their folder, templates use their plain file name so `uebertool_twig_loader` can find them by template name. A script and a stylesheet with the same name end up in the same library.

`js__main`, `css__tailwind` and `css__gin-custom` are loaded on every page through the [dist theme](04-theme-info.md).

## Detected Drupal dependencies

The plugin scans each script for Drupal APIs and adds the matching core libraries as dependencies:

| Code contains | Dependency |
| --- | --- |
| `once(`, `once.` | `core/once` |
| `Drupal.` | `core/drupal` |
| `drupalSettings.` | `core/drupalSettings` |
| `Drupal.announce` | `core/drupal.announce` |
| `Drupal.debounce` | `core/drupal.debounce` |
| `Drupal.dialog` | `core/drupal.dialog` |
| `Drupal.ajax`, `Drupal.Ajax`, `Drupal.theme.ajax…` | `core/drupal.ajax` |
| `Drupal.displace` | `core/drupal.displace` |
| `Drupal.Message` | `core/drupal.message`, `<theme>_dist/status-messages` |
| `Drupal.progress`, `Drupal.Progress` | `core/drupal.progress` |
| `Cookies.` | `core/js-cookie` |
| `FloatingUICore.`, `FloatingUIDOM.` | `core/internal.floating-ui` |

## CSS groups

Drupal orders CSS by group. A stylesheet is assigned to a group by its file name: `*.layout.css`, `*.component.css`, `*.state.css` and `*.theme.css`. Everything else is `base`. The group suffix is removed from the library name, so `css/card.component.css` and `css/card.ts` share the library `css__card`.

:::caution[Known issue in production builds]
With Vite 8, a production build of `css/demo.component.css` produced `demo.[hash].css` in the dist root. The resulting library was `demo` in group `base` instead of `css__demo` in group `component`. The dev server uses the source file names and is not affected.
:::

## Dev vs. build

- **Dev:** all assets are external URLs pointing to the Vite dev server, plus a `vite` library that loads `/@vite/client` for HMR.
- **Build:** hashed files in `dist/`, scripts as `type: module`, never preprocessed or aggregated by Drupal.
