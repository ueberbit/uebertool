---
title: 'Auto-imports'
description: 'Use Vue, VueUse, your own utils and components without import statements.'
---

Commonly used APIs are available without an `import` statement, powered by [unimport](https://github.com/unjs/unimport) and [unplugin-vue-components](https://github.com/unplugin/unplugin-vue-components). Only what you use ends up in the bundle.

::preview{demo=auto-imports title="No imports in this component"}

```vue file=templates/demos/vue/mouse-tracker.visible.ce.vue
```

## What is available

| Source | Examples |
| --- | --- |
| Vue | `ref`, `computed`, `watch`, `onMounted`, … |
| Pinia | `defineStore`, `storeToRefs`, … |
| VueUse | `useMouse`, `useIntervalFn`, … (except `toRef` and `toValue`, which come from Vue) |
| Alpine.js | `Alpine` (default export of `alpinejs`) |
| Your code | Every export of a file in `js/**`, e.g. `formatMs` from `js/utils/formatMs.ts` |

:::caution[templates/ is not scanned]
The default configuration also lists `./templates/**/*.{js|ts}`, but the glob uses `|` instead of `,` and matches nothing. Put shared code into `js/`, e.g. `js/utils`, which is not an entrypoint.
:::

## Components

Components are resolved by name in Vue templates:

- your `*.ce.vue` files in `js/` and `templates/` that have no loading strategy,
- [Headless UI](https://headlessui.com) components,
- VueUse components and directives.

## Types

Declarations are generated into `.uebertool/unimport.d.ts` and `.uebertool/components.d.ts`, both included by the [generated tsconfig](05-types.md).

## Configuration

The `unimport` and `components` options are deep-merged with the defaults, so arrays such as `presets` and `dirs` are extended, not replaced:

```ts title="vite.config.ts"
uebertool({
  unimport: {
    dirs: ['./js/composables/**/*'],
    imports: [{ name: 'gsap', from: 'gsap' }],
  },
})
```

:::caution
Presets are resolved from your theme directory. Install `@vueuse/core` (and `pinia`, if you use it) in the theme itself.
:::
