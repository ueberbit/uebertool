---
title: 'Options'
description: 'All options of the plugin and their defaults.'
---

All options are optional and deep-merged with the defaults.

```ts title="vite.config.ts"
uebertool({
  url: 'http://localhost',
  ce: { prefix: 'mytheme' },
  breakpoints: { multipliers: ['1x', '2x'] },
  features: {
    twighmr: true,
    clearCache: 'drush cr',
  },
  baseTheme: false,
  themePackage: 'mytheme',
  vue: {},
  unimport: {},
  components: {},
})
```

| Option | Default | Description |
| --- | --- | --- |
| `url` | `'http://localhost'` | Origin of the dev server used in the dev `libraries.yml`. The port comes from `server.port` (default 5173). If the option is not set, `UEBERTOOL_URL` or `DDEV_PRIMARY_URL` is used. |
| `ce.prefix` | theme name | Prefix of [custom element](../03-custom-elements/01-custom-element-loader.md) tag names. |
| `breakpoints.multipliers` | `['1x', '2x']` | Multipliers of every generated [breakpoint](../02-build/03-breakpoints.md). |
| `features.twighmr` | `true` | Enables [Twig HMR](../04-developer-experience/03-twig-hmr.md). |
| `features.clearCache` | `'drush cr'` | Command run after [files were added or removed](../04-developer-experience/04-restart.md). `false` disables it. |
| `baseTheme` | `false` | Base theme of the generated [dist theme](../02-build/04-theme-info.md). `false` means no base theme. Set e.g. `'stable9'` to keep the old markup. |
| `themePackage` | theme name | `package` of the dist theme. |
| `vue` | custom elements = tags with a dash | Options for `@vitejs/plugin-vue`. |
| `unimport` | see [Auto-imports](../04-developer-experience/01-auto-imports.md) | Options for `unimport`. |
| `components` | see [Auto-imports](../04-developer-experience/01-auto-imports.md) | Options for `unplugin-vue-components`. |

:::caution[No effect]
`features.resetTheme` and `experimental` are part of the options type but currently not used by any plugin.
:::

## Environment variables

| Variable | Effect |
| --- | --- |
| `UEBERTOOL_URL` | Dev server origin, if `url` is not set. |
| `DDEV_PRIMARY_URL` | Same, set automatically inside DDEV. An `https://` URL switches HMR to `wss`. |
