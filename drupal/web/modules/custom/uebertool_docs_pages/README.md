# UEBERTOOL Docs pages

Routes, sidebar and Markdown rendering of the `@ueberbit/vite-plugin-drupal`
docs. The pages are Markdown files in the `uebertool_docs` theme, which also
provides the layout, the components and the demos.

## Functionality

- `/uebertool` redirects to the first page, `/uebertool/{slug}` renders a
  Markdown page, `/uebertool/preview/{demo}` renders a demo without the layout
  (used in iframes).
- `DocsNavigation` builds the sidebar from the theme's `docs/` folder.
- `DocsMarkdown` renders a page with `league/commonmark`.
- `DocsThemeNegotiator` forces the `uebertool_docs` theme on these routes.
- `StaticExportPathsSubscriber` limits the Tome static export to the docs.

## Pages and sidebar

```
docs/
  01-start-here/
    README.md              front matter title: group label
    01-getting-started.md  /uebertool/getting-started
  02-build/
    README.md
    01-entrypoints.md      /uebertool/entrypoints
```

- Folders are groups, files are pages. The numeric prefixes set the order and
  are not part of the URL, so moving a page to another group keeps its URL.
  Slugs must be unique across folders.
- Each page has `title` and `description` in its front matter.
- Link to other pages by their relative file path, e.g.
  `[entrypoints](../02-build/01-entrypoints.md#fragment)`. The links are
  rewritten to the page URL and also work when browsing the docs on GitHub.

## Markdown syntax

GitHub-flavoured Markdown plus:

| Syntax | Renders |
| --- | --- |
| ` ```ts title="vite.config.ts" ` | Code block of the theme's `code-block` component. |
| ` ```ts file=templates/demos/x.ts ` (empty body) | Code block with the content of a file of the theme, the path is the default title. A missing file shows a hint to run `pnpm build`. |
| `::preview{demo=alpine title="Alpine store" iframe height=300}` | Live preview of `templates/demos/{demo}.html.twig`, inline or in an iframe. |
| `::preview{demo=translations iframe lang=de}` | The preview in another interface language, e.g. `/de/uebertool/preview/translations`. Needs an iframe. |
| `:::caution[Title]` … `:::` | Aside of type `note`, `tip`, `caution` or `danger`. The title is optional. |

- Code blocks and directives become render elements that include the theme's
  components, so the libraries `uebertool_twig_loader` attaches to them bubble
  like in any other template. Only plain Markdown becomes markup.
- A closing `:::` ends the innermost aside even inside a code block.
- `file=` paths are resolved with `realpath` and must stay inside the theme.
- Raw HTML is allowed: the Markdown files are part of the codebase.
- Unknown directives throw, so a typo fails the page and the static export.
- Nothing is cached besides Drupal's render and page caches: a page is parsed
  only on a cache miss, and the sidebar reads the front matter of all pages
  once per request.

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
  iframes. A new demo therefore needs an iframe preview, or it is missing
  from the export.
- Tome does not follow dynamic `import()`, so the script copies the theme's
  whole `dist/` into the export.
- Tome reports success even when a page fails to render, so the script checks
  that every page in `docs/` was exported and every exported link resolves.
- The subscriber subscribes by event name, so the module works without Tome.

Locally: `ddev exec -d /var/www/html/drupal scripts/export-docs.sh`.
