#!/usr/bin/env bash
# Exports the docs as a static site for GitHub Pages with Tome.
#
# Usage: scripts/export-docs.sh [drush uri]   (default: http://localhost)
# Run from the composer root (drupal/), e.g.
#   ddev exec -d /var/www/html/drupal scripts/export-docs.sh
# The docs routes live under /uebertool, the path GitHub Pages serves the
# project from. html/uebertool/ is the site to publish; DDEV serves html/ at
# https://static.uebertool.localhost.
set -euo pipefail

uri="${1:-http://localhost}"
base=/uebertool
out="html${base}"
theme_dist=web/themes/custom/uebertool_docs/dist
docs=web/themes/custom/uebertool_docs/docs

# Tome skips paths it has cached as exported, even if the files are gone, and
# Drupal may still know the library hashes of an older theme build.
rm -rf html
vendor/bin/drush cache:rebuild --uri="${uri}"
vendor/bin/drush tome:static -y --ignore-warnings --uri="${uri}"

# Assets are exported at the root. Move them below the base path and copy the
# chunks only loaded via dynamic import(), which Tome does not find.
for dir in core sites themes; do
  if [ -d "html/${dir}" ]; then
    mkdir -p "${out}/${dir}"
    cp -r "html/${dir}/." "${out}/${dir}/"
    rm -rf "html/${dir}"
  fi
done
# Pages of other languages (e.g. /de/uebertool/preview/translations) are
# exported at the root too. Move them below the base path as well.
for dir in html/*/; do
  lang="$(basename "${dir}")"
  if [ -d "html/${lang}${base}" ]; then
    mkdir -p "${out}/${lang}"
    mv "html/${lang}${base}" "${out}/${lang}/"
    rmdir "html/${lang}" 2>/dev/null || true
    find "html" -type f -name '*.html' -print0 \
      | xargs -0 sed -i -E "s#([\"'])/${lang}${base}/#\1${base}/${lang}${base}/#g"
  fi
done
mkdir -p "${out}/${theme_dist#web/}"
cp -r "${theme_dist}/." "${out}/${theme_dist#web/}/"

# Prefix the asset URLs in attributes, CSS url() and Vite's preload base.
find "${out}" -type f \( -name '*.html' -o -name '*.css' -o -name '*.js' \) -print0 \
  | xargs -0 sed -i -E "s#([\"'\`(=])/(core|sites|themes)([/\"'?])#\1${base}/\2\3#g"

touch "${out}/.nojekyll"

# Tome reports success even if pages failed to render. Fail instead.
errors=0
for slug in $(find "${docs}" -mindepth 2 -name '[0-9]*-*.md' -printf '%f\n' | sed -E 's/^[0-9]+-//; s/\.md$//'); do
  [ -f "${out}/${slug}/index.html" ] || { echo "Missing page: ${base}/${slug}"; errors=1; }
done
for url in $(grep -rhoE "(href|src)=\"/[^/\"#?][^\"#?]*" html --include='*.html' | sed -E 's#^(href|src)="##' | sort -u); do
  file="html${url}"
  [ -f "${file}" ] || [ -f "${file%/}/index.html" ] || { echo "Broken link: ${url}"; errors=1; }
done
if grep -rlq 'The website encountered an unexpected error' html --include='*.html'; then
  echo 'A page contains a Drupal error.'
  errors=1
fi
exit "${errors}"
