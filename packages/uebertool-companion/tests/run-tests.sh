#!/bin/sh
# Runs the companion's kernel tests in the drupal/ playground. Run it in the
# ddev web container from the repo root (`ddev exec pnpm run test:companion`).
set -eu

root="$(cd "$(dirname "$0")/../../.." && pwd)"
ignore_file="$(mktemp)"
trap 'rm -f "$ignore_file"' EXIT

# SYMFONY_DEPRECATIONS_HELPER replaces core's ignore file, so combine core's
# patterns with ours.
cat "$root/drupal/web/core/.deprecation-ignore.txt" \
  "$root/packages/uebertool-companion/tests/.deprecation-ignore.txt" > "$ignore_file"

cd "$root/drupal/web"
SYMFONY_DEPRECATIONS_HELPER="ignoreFile=$ignore_file" php core/scripts/run-tests.sh \
  --sqlite /tmp/rt.sqlite \
  --dburl sqlite://localhost//tmp/rt-db.sqlite \
  --url https://uebertool.localhost \
  --php "$(command -v php)" \
  --concurrency 4 \
  --verbose \
  --directory modules/custom/uebertool_companion
