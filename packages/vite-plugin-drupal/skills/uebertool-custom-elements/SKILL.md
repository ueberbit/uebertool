---
name: uebertool-custom-elements
description: Write custom elements (web components) in a Drupal theme built with @ueberbit/vite-plugin-drupal (UEBERTOOL). Use when creating or changing `*.ce.vue`, `*.ce.ts`, `*.ce.tsx` or `*.ce.js` files, choosing a loading strategy (eager, idle, lazy, visible), using a custom element tag in Twig, styling the shadow DOM with Tailwind, or documenting an element with `<docs>` / `@element` for editor support.
---

# Custom elements with UEBERTOOL

The plugin turns files named `*.{strategy}.ce.{vue,ts,tsx,js,jsx}` into custom
elements. Nothing is registered by hand and no Drupal library is attached: the
loader is injected into the theme's `js/main.ts` (or `main.js`), which must
exist. Full docs: https://ueberbit.github.io/uebertool/ (Custom elements).

## 1. Name the file

```
<any top-level dir>/**/<name>.<strategy>.ce.<ext>   →   <prefix>-<name>
templates/components/card/card.visible.ce.vue        →   <mytheme-card>
templates/components/hero/HeroSlider.idle.ce.ts      →   <mytheme-hero-slider>
```

- **Prefix:** the `ce.prefix` option of `uebertool({...})` in `vite.config.ts`, by default the theme name.
- **Name:** camelCase and PascalCase are hyphenated, so the tag always contains a dash.
- **Without a strategy** (`Foo.ce.vue`), the file is not an element. It is a nested Vue component (see 4).

## 2. Pick the loading strategy

| Strategy | Loaded | Use for |
| --- | --- | --- |
| `visible` | dynamic import once an instance is near the viewport (`rootMargin: 50%`) | **Default choice.** Anything not on most pages. |
| `idle` | dynamic import in `requestIdleCallback` (max. 1 s) | Small elements used on most pages. |
| `lazy` | dynamic import right after the main bundle | Needed early, but not render-blocking. |
| `eager` | in the main bundle | Rarely. Must have a **default** export. |

`eager`, `idle` and `lazy` modules are imported on **every page** that loads
`js/main`, whether the tag is used or not. `visible` registers
`Drupal.behaviors.customElementLoader`, so it also picks up elements in content
added by AJAX.

Exports: `idle`, `lazy` and `visible` register the **first export** (for
`.vue`, the default export). `eager` needs a **default export**.

## 3. Write the element

### Vue (stateful or interactive UI, Tailwind)

```vue
<!-- templates/components/counter/counter.visible.ce.vue → <mytheme-counter> -->
<docs lang="ts">
/**
 * A counter.
 *
 * @element mytheme-counter
 *
 * @attr {string} label - Button label.
 * @attr {number} start - Initial value.
 * @attr {boolean} disabled - Disables the button.
 * @fires change - The new value, in `event.detail[0]`.
 * @slot - Text after the button.
 */
</docs>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  label?: string
  start?: number
  disabled?: boolean
}>(), { label: 'Count', start: 0 })

const emit = defineEmits<{ change: [value: number] }>()
const count = ref(props.start) // ref, computed, … and @vueuse/core are auto-imported

function increment() {
  count.value++
  emit('change', count.value)
}
</script>

<template>
  <button class="rounded-md bg-indigo-600 px-3 py-2 text-white" :disabled="disabled" @click="increment">
    {{ label }}: {{ count }}
  </button>
  <slot />
</template>

<style>
button:disabled { opacity: 0.5; }
</style>
```

Rules:

- **`<script setup>` only.** Builds disable the Options API (`__VUE_OPTIONS_API__: false`).
- **Props are attributes.** Kebab-case attributes map to camelCase props. Values arrive as strings:
  - `Number` props are converted.
  - `Boolean` props are `true` when the attribute is present and `false` when it is absent.
  - Pass objects as a JSON string and parse them in the component, or set them as a property from JS.
  - Reading a prop back through the element (`el.disabled`) returns the raw value that was set, for example `''`, not the cast one.
- **Don't reuse native `HTMLElement` property names** for props, for example `title`, `hidden`, `id`, `lang`, `dir`, `slot`, `style` or `className`. The prop would overwrite the native property, and Vue warns. Use `heading` instead of `title`.
- **Events:** `emit('change', value)` dispatches a `CustomEvent('change')` with `detail` set to the array of arguments. A hyphenated copy is dispatched for camelCase names. Events **do not bubble**: listen on the element itself. To make an event bubble, emit an object whose keys include the event options. The object is also `detail[0]`, so it carries the data too: `emit('change', { bubbles: true, composed: true, value })`, read as `e.detail[0].value`.
- **The host element:** use Vue's `useHost()` / `useShadowRoot()` or `$host`. Never use the internal instance.
- **Styles:**
  - Tailwind utilities work inside the shadow DOM.
  - The `:host` base styles (`display: block`, `box-sizing`, `[hidden]`) are applied automatically.
  - `<style>` blocks of the element and of nested `*.ce.vue` components are put into the shadow root.
  - Page CSS does **not** reach into the shadow root. Styles of plain `*.vue` components don't either.
  - Unlayered `<style>` rules override Tailwind utilities, because Tailwind sits in cascade layers.

### Vanilla, TSX or Lit (small, no framework, or an existing Lit codebase)

```ts
// templates/components/greeting/greeting.idle.ce.ts → <mytheme-greeting>
/**
 * Greets someone.
 *
 * @element mytheme-greeting
 *
 * @attr {string} name - Who to greet.
 */
export class Greeting extends HTMLElement {
  connectedCallback() {
    const p = document.createElement('p')
    p.textContent = `Hello, ${this.getAttribute('name') ?? 'somebody'}!`
    this.replaceChildren(p)
  }
}
```

JSX in `*.ce.tsx` / `*.ce.jsx` renders with Preact (a peer dependency, install it in the theme). The plugin sets the JSX import source, don't configure it again:

```tsx
import { render } from 'preact'

export class Greeting extends HTMLElement {
  connectedCallback() {
    render(<p>Hello, {this.getAttribute('name') ?? 'somebody'}!</p>, this)
  }

  disconnectedCallback() {
    render(null, this)
  }
}
```

- **Exports:** export the class, and make it the first export (or the default export for `eager`).
- **Put text into the DOM with `textContent`.** Attribute values come from content editors, so don't use `innerHTML` with them.
- **`@element` is required** in the JSDoc of TS/JS elements, or they are missing from the editor data.
- **Lit** is a peer dependency: add `lit` to the theme. Use `static styles` for its CSS. Tailwind is only adopted into Vue elements automatically.

## 4. Nested Vue components

A `*.ce.vue` file **without** a strategy in `js/` or `templates/` is a regular
component. You can use it by its file name in any Vue template without
importing it:

```
templates/components/card/CardBadge.ce.vue   →   <CardBadge label="New" />
```

Its `<style>` is injected into the shadow root of the element it renders in.
Use `*.ce.vue` for nested components, not plain `*.vue`, because only then do
their styles reach the shadow DOM. A newly added nested component needs a
dev-server restart to be resolved.

## 5. Use it in Twig

```twig
<mytheme-counter label="{{ 'Likes'|t }}" start="{{ node.likes.value }}" {{ disabled ? 'disabled' }}>
  {{ content.field_note }}
</mytheme-counter>
```

- Twig auto-escapes attribute values. Don't use `|raw` on editor content.
- Children of the tag become the default slot. In Vue they are rendered through `<slot />`.
- Listen to events in a behavior:
  ```ts
  once('counter', 'mytheme-counter', context).forEach((el) => {
    el.addEventListener('change', e => console.warn((e as CustomEvent).detail[0]))
  })
  ```
- Elements upgrade after their module loads. Style the not-yet-defined state with `mytheme-counter:not(:defined)` to avoid layout shift.

## 6. Document it (editor support)

- While the dev server runs, the plugin runs web-component-analyzer over `js/`, `templates/` and `components/` on start and after every change to a `*.ce.*` file.
- It writes `.uebertool/vscode.html-custom-data.json`, which gives tag and attribute completion in Twig and HTML. `.uebertool/custom-elements.d.ts`, which types `document.querySelector('<tag>')` for Vue elements, is also written on `vite build`.
- For Vue, the JSDoc goes into a `<docs lang="ts">` block, which is removed from the bundle. Supported tags include `@element`, `@attr`, `@prop`, `@fires`, `@slot`, `@csspart` and `@cssprop`.
- The theme's `tsconfig.json` should extend `./.uebertool/tsconfig.json`.

## 7. Check your work

1. Keep `ddev exec pnpm run dev` running in the theme (`pnpm run build` does not update the editor data).
2. Check `.uebertool/vscode.html-custom-data.json` (the tag and attributes are listed) and `.uebertool/custom-elements.d.ts` (Vue elements only).
3. In the browser:
   - `customElements.get('mytheme-x')` is defined once the strategy has loaded it. For `visible`, scroll it into view.
   - In the element's shadow root, check that Tailwind and component styles apply.
   - The console shows no errors and no Vue warnings. A prop named like a native property shows up as a warning.
4. Lint only the changed files: `ddev exec pnpm exec eslint <files>`.
