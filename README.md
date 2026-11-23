# UEBERTOOL

A collection of tools and configs for unified standards across UEBERBIT projects.

Docs: https://ueberbit.github.io/uebertool/

It currently consists of:

## Linting:
- [eslint config](https://github.com/ueberbit/uebertool/tree/main/packages/eslint-config)
- [stylelint config](https://github.com/ueberbit/uebertool/tree/main/packages/stylelint-config)

## Bundling
- [vite-plugin-drupal](https://github.com/ueberbit/uebertool/tree/main/packages/vite-plugin-drupal)

## Drupal Integration & Utils
- [uebertool-companion](https://github.com/ueberbit/uebertool/tree/main/packages/uebertool-companion)

## Utils
- [postcss](https://github.com/ueberbit/uebertool/tree/main/packages/postcss)
- [tailwind](https://github.com/ueberbit/uebertool/tree/main/packages/tailwind)
- [storybook](https://github.com/ueberbit/uebertool/tree/main/packages/drupal-storybook)

## Docs

The docs are Markdown files in `drupal/web/themes/custom/uebertool_docs/docs/`,
rendered by a Drupal site in `drupal/` (module `uebertool_docs_pages`, theme
`uebertool_docs`), exported to static HTML with [Tome](https://www.drupal.org/project/tome)
and deployed to GitHub Pages by `.github/workflows/docs.yml` on every push to `main`.

Locally with DDEV:

- Dynamic: https://uebertool.localhost/uebertool/
- Static export: `ddev exec -d /var/www/html/drupal scripts/export-docs.sh`, then
  https://static.uebertool.localhost/uebertool/

Details in the [uebertool_docs_pages README](drupal/web/modules/custom/uebertool_docs_pages/README.md).