---
title: 'Translations'
description: 'Drupal.t() and Drupal.formatPlural() in theme JS, custom elements included.'
---

Use Drupal's own JS translation API in any theme source: entrypoints, custom elements, Vue components. Strings show up in **Configuration → Regional and language → User interface translation** like the ones from core.

The same custom element, once in English and once on the German site (`/de/…`):

::preview{demo=translations title="English"}

::preview{demo=translations iframe lang=de height=180 title="Deutsch"}

The German strings come from a `.po` file of the docs theme. Translate in the UI or import a file:

```sh
drush locale:import de themes/custom/uebertool_docs/translations/de.po
```

```po file=translations/de.po
```

```ts file=templates/demos/translations/translated-cart.idle.ce.ts title="translated-cart.idle.ce.ts"
```

```twig file=templates/demos/translations.html.twig
```

## What you can write

Locale finds strings with a regular expression, not by running your code. Only literal strings in `'…'` or `"…"` are picked up.

```ts
// Plain string.
Drupal.t('Your cart')

// Placeholders: @name is escaped, %name is escaped and emphasized,
// !name is inserted as is.
Drupal.t('Welcome back, @name!', { '@name': user.name })

// Context, for words with several meanings.
Drupal.t('Order', {}, { context: 'Sort' })

// Singular and plural. @count is set for you.
Drupal.formatPlural(count, '1 item', '@count items')
Drupal.formatPlural(count, '1 item in @cart', '@count items in @cart', { '@cart': name }, { context: 'Shop' })
```

These are **not** found, the string stays English:

```ts
const label = 'Your cart'
Drupal.t(label) // variable instead of a literal

Drupal.t(`Your cart`) // backticks, use '…' or "…"
Drupal.t(`Hello ${name}`) // expression in the string, use a placeholder

const { t } = Drupal
t('Your cart') // has to be called as Drupal.t()
```

## How strings reach locale

Locale only scans the JS files of a library that Drupal loads. That misses chunks loaded with `import()`, i.e. every custom element, and everything in dev, where the JS comes from Vite. So the plugin lists each source file under `js/`, `templates/` and `components/` that calls `Drupal.t()` or `Drupal.formatPlural()` in `dist/translations.json`:

```json title="dist/translations.json"
{
  "root": "..",
  "files": [
    "templates/demos/translations/translated-cart.idle.ce.ts"
  ]
}
```

With `uebertool_companion` enabled, Drupal hands these source files to locale. A content hash in the path makes sure a changed file is parsed again.

- New strings show up after `drush cr`.
- Deploy the source files along with `dist/`.
- Locale reads the sources, not the bundle. The minifier may rewrite the strings in `dist/`, at runtime only the `Drupal.t()` call matters.
