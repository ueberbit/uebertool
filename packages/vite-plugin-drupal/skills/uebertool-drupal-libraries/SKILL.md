---
name: uebertool-drupal-libraries
description: Use Drupal core JS libraries instead of npm packages in a Drupal theme built with @ueberbit/vite-plugin-drupal (UEBERTOOL). Use when writing theme JS/TS that needs behaviors, once, translations, ajax, dialogs, announcements, debounce, focus trapping, form states, table drag, htmx, SortableJS, tabbable or loadjs, when about to `npm install`/`pnpm add` such a package, or when a generated library is missing a `core/*` dependency.
---

# Drupal core libraries with UEBERTOOL

Drupal core already ships a set of JS libraries. Use them instead of adding
the same thing from npm: the code is already on the page (or cached), it is
patched and updated with core, and modules that rely on it share one instance.

You never write `dependencies:` by hand. The plugin scans the built code of
each entry and of every chunk it imports (custom elements included) and adds
the matching `core/*` library to the generated `<theme>.libraries.yml`.

## Rule: use the global, never import

Detection is a regex over the bundled code, so it only sees the **global**
names below. Use them as globals:

```ts
// ✅ detected → core/drupal, core/once, core/drupal.announce
Drupal.behaviors.accordion = {
  attach(context) {
    once('accordion', '.accordion', context).forEach((el) => {
      Drupal.announce(Drupal.t('Accordion ready'))
    })
  },
}
```

```ts
// ❌ ships a second copy, core version not used
import once from '@drupal/once'
import htmx from 'htmx.org'
import $ from 'jquery'
import { debounce } from 'lodash-es'
import Sortable from 'sortablejs'
```

Before `pnpm add`-ing a package, check the table. If core has it, use core.
If the global is untyped, add a local `declare const Drupal: any` (or a
proper type) instead of installing the npm package for its types.

## Detected libraries

| Use in code | Library added | Instead of npm |
| --- | --- | --- |
| `Drupal.*` (behaviors, `t`, `formatPlural`, `theme`, `url`, `checkPlain`) | `core/drupal` | i18n / sanitize helpers |
| `drupalSettings.*` | `core/drupalSettings` | – |
| `once(…)`, `once.remove(…)` | `core/once` | `@drupal/once` |
| `Drupal.announce` | `core/drupal.announce` | aria-live helpers |
| `Drupal.debounce` | `core/drupal.debounce` | `lodash.debounce` |
| `Drupal.dialog` | `core/drupal.dialog` | modal libraries |
| `Drupal.offCanvas` | `core/drupal.dialog.off_canvas` | drawer libraries |
| `Drupal.ajax`, `Drupal.Ajax`, `Drupal.theme.ajax*` | `core/drupal.ajax` | – |
| `Drupal.displace` | `core/drupal.displace` | – |
| `Drupal.Message` | `core/drupal.message` + `<theme>/status-messages` | toast libraries |
| `Drupal.ProgressBar`, `Drupal.theme.progressBar` | `core/drupal.progress` | – |
| `Drupal.autocomplete` | `core/drupal.autocomplete` | – |
| `Drupal.theme.checkbox` | `core/drupal.checkbox` | – |
| `Drupal.DetailsSummarizedContent` | `core/drupal.collapse` | – |
| `Drupal.DropButton` | `core/drupal.dropbutton` | – |
| `Drupal.htmx` | `core/drupal.htmx` | – |
| `Drupal.states` | `core/drupal.states` | – |
| `Drupal.tabbingManager` | `core/drupal.tabbingmanager` | `focus-trap` |
| `Drupal.tableDrag` | `core/drupal.tabledrag` | – |
| `Drupal.TableResponsive` | `core/drupal.tableresponsive` | – |
| `Drupal.tableSelect` | `core/drupal.tableselect` | – |
| `Drupal.timeDiff` | `core/drupal.time-diff` | `timeago`, `date-fns` (relative time) |
| `Drupal.verticalTab` | `core/drupal.vertical-tabs` | – |
| `htmx.*` | `core/htmx` | `htmx.org` |
| `loadjs(…)` | `core/loadjs` | `loadjs` |
| `Sortable(…)`, `Sortable.*` | `core/sortable` | `sortablejs` |
| `tabbable.*` | `core/tabbable` | `tabbable` |

Notes:

- **No jQuery.** Write vanilla JS: `querySelector`, `addEventListener`,
  `fetch`, `classList`, `element.animate()`. Don't use jQuery, neither from npm
  nor from core. Legacy code calling `jQuery(…)` is still detected
  (`core/jquery`), `$` is not. Be aware that `Drupal.ajax`, `Drupal.dialog`
  and `Drupal.autocomplete` load jQuery as their own dependency, so only use
  them when you really need them.
- **Avoid** `core/internal.*` (private to core) and `core/js-cookie`
  (deprecated). They are still detected (`FloatingUICore`/`FloatingUIDOM`,
  `Cookies`) for old code, but don't use them in new code.
- `js/main.ts` always gets `core/drupal`, because the custom element loader
  uses `Drupal.behaviors`.

## Libraries without a detectable API

These have no global to detect. Attach them yourself in Twig
(`{{ attach_library('core/drupal.active-link') }}`) or in a hand-written
library of the theme:

- `core/drupal.active-link`: `is-active` on links to the current page.
- `core/drupal.machine-name`, `core/drupal.form`, `core/drupal.tableheader`
  (CSS only), `core/drupal.jquery.position`.

## Check the result

After `pnpm build`, look at `<outDir>/<theme>.libraries.yml` (`dist/` by
default): the library of your entry must list the expected `core/*`
dependencies. In dev only the entry files themselves are scanned, not what
they import. If a dependency is missing, the code most likely imports the npm
package or hides the call behind an alias (`const { announce } = Drupal` or
`window['Drupal']` are not detected; write `Drupal.announce(…)`).

Core's library list: `core/core.libraries.yml` in the Drupal docroot.
