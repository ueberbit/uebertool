# UEbertool Companion

Drupal modules that go with the UEbertool theme tooling. The base module adds
the cascade layer order (`@layer properties, theme, base, drupal, components,
components-custom, utilities;`) to every page; the submodules are opt-in.

Requires Drupal 11.1 or later (the base module uses OOP hooks).

## Modules

- [uebertool_asset_renderer](modules/uebertool_asset_renderer/README.md):
  removes the query string from hashed theme assets.
- [uebertool_cascade_layer](modules/uebertool_cascade_layer/README.md): puts
  aggregated Drupal CSS into `@layer drupal`.
- [uebertool_ckeditor5](modules/uebertool_ckeditor5/README.md): link
  decorators for CKEditor 5.
- [uebertool_enhancements](modules/uebertool_enhancements/README.md): examples
  for common theming problems.
- [uebertool_pswp](modules/uebertool_pswp/README.md): Photoswipe markup for
  image formatters.
- [uebertool_twig](modules/uebertool_twig/README.md): Twig helpers.
- [uebertool_twig_loader](modules/uebertool_twig_loader/README.md): attaches
  template and component libraries automatically.

## Tests

```sh
ddev exec pnpm run test:companion
```

The script (`tests/run-tests.sh`) runs `core/scripts/run-tests.sh` for this
package and needs `drupal/core-dev` in the playground. Deprecations from core
that the package can't fix are ignored via `tests/.deprecation-ignore.txt`
(added to core's own list); remove an entry once core has fixed it.

The fixture themes in `tests/themes` provide a `*_dist` base theme with
libraries, a component and a logo.
