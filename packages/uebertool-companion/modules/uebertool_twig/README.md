# UEbertool Twig

Twig filters and functions for UEbertool themes. Use the snippet file
(`uebertool_twig.code-snippets`, scaffolded to `.vscode/`) for docs and emmet.

## Functionality

- Field helpers: `field_empty`, `field_isset`, `file_size`, `file_mime`.
- Link helpers: `link_url`, `link_text`, `link_attrs`, `button()`,
  `buttons()`.
- Misc: `languages()`, `URL()`, `HTML()` (demo only), `class()`, `uuid()`.

## Template debug comments

With Twig debug on, `{% include %}` and `{% embed %}` get the same
`BEGIN OUTPUT` / `END OUTPUT` comments Drupal prints for theme hook templates,
marked with 📎, so the Drupal picker of the Vite devtools can select them. SDC
components (core marks those), missing `ignore missing` targets and non-Twig
files are skipped. Paths are app root relative, or absolute for a symlinked
extension, because Twig resolves symlinks. Without debug the compiled
templates are unchanged.

## Buttons

`button(link_or_field, variant)` returns a single link with the classes
`button` and `button--<variant>`; for a field it takes the first link.
`buttons(field, variant_or_variants)` styles every link of a field, variants
can be given per delta. The classes go into `#attributes`; the Url object is
not changed.

## Tailwind values

There is no `tailwind_config()` any more: Tailwind 4 has no JS config to
export. Use the CSS variables Tailwind generates from `@theme`, e.g.
`var(--color-gray-50)`.

## Cacheability

`link_url` and `link_attrs` bubble the cache metadata of the generated URL /
rendered link to the current render context. `link_attrs` renders the link to
get core's attributes, so avoid it in large loops.

## Deprecations

Removed in 1.0.0:

- `link_url`, `link_text` and `link_attrs` on a field render array (since
  0.6.0). Use them on a field item instead:
  `content.field_link|field_value|first|link_url`.
- Classes from the Url object's `attributes` option in `link_attrs` (since
  0.7.5). Set `#attributes` on the link element instead, see
  https://www.drupal.org/node/3494015.
