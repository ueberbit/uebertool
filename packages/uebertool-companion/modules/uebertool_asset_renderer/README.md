# UEbertool Asset Renderer

Removes Drupal's cache busting query string from assets that opt in. Building
the assets is left to vite-plugin-drupal.

## Functionality

- Assets with `noquery: true` in a library definition are rendered without
  `?<query string>`. vite-plugin-drupal sets it for its hashed build files,
  whose names already change with their content.

The query string is skipped by marking the asset as `preprocessed`, which is
what core checks before appending it. `noquery: false` keeps the query string.
