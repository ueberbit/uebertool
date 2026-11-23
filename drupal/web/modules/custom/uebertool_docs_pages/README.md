# UEBERTOOL Docs pages

Routes and navigation of the `@ueberbit/vite-plugin-drupal` docs. The page
content, layout and demos live in the `uebertool_docs` theme.

## Functionality

- `/uebertool` redirects to the first page, `/uebertool/{slug}` renders
  `templates/docs/{slug}.html.twig` of the theme, `/uebertool/preview/{demo}`
  renders a demo without the layout (used in iframes).
- `uebertool_docs_pages.navigation.yml` is the sidebar and the list of valid
  slugs (`DocsNavigation`).
- `DocsThemeNegotiator` forces the `uebertool_docs` theme on these routes.
- `StaticExportPathsSubscriber` limits the Tome static export to the docs.

## Static export (GitHub Pages)

`scripts/export-docs.sh` in the composer root exports the docs with
`tome_static` to `html/uebertool/`, which `.github/workflows/docs.yml`
publishes to https://ueberbit.github.io/uebertool/. Locally DDEV serves the
export at https://static.uebertool.localhost/uebertool/
(`.ddev/nginx_full/static.conf`).

- The routes live under `/uebertool` because that is the path GitHub Pages
  serves the project from, so page links need no rewriting. Changing the
  prefix means changing the routes, the script's `base` and the Pages URL.
- Tome exports assets (`/core`, `/sites`, `/themes`) at the root. The script
  moves them below `/uebertool` and prefixes their URLs. Tome's own
  subdirectory support (`--uri=…/uebertool`) writes collected and crawled
  paths to different directories, so don't use it.
- Tome collects every route and entity of the site. The subscriber keeps only
  `/uebertool`; pages and previews are found by crawling sidebar links and
  iframes. A new page therefore needs a sidebar entry, a new demo an iframe
  preview, or they are missing from the export.
- Tome does not follow dynamic `import()`, so the script copies the theme's
  whole `dist/` into the export.
- Tome reports success even when a page fails to render, so the script checks
  that every sidebar page exists and every exported link resolves.
- The subscriber subscribes by event name, so the module works without Tome.

Locally: `ddev exec -d /var/www/html/drupal scripts/export-docs.sh`.
