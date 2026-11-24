<?php

declare(strict_types=1);

namespace Drupal\uebertool_asset_renderer\Asset;

use Drupal\Core\Asset\AssetCollectionRendererInterface;

/**
 * Renders CSS assets without the cache busting query string if asked to.
 *
 * Libraries opt in with "noquery: true" on an asset, e.g. for files whose
 * names already contain a content hash.
 */
class CssCollectionRendererDecorator implements AssetCollectionRendererInterface {

  public function __construct(protected AssetCollectionRendererInterface $prototype) {}

  /**
   * {@inheritdoc}
   */
  public function render(array $css_assets): array {
    foreach ($css_assets as &$css_asset) {
      if (!empty($css_asset['noquery'])) {
        // Drupal doesn't append the query string to preprocessed assets.
        $css_asset['preprocessed'] = TRUE;
      }
    }

    return $this->prototype->render($css_assets);
  }

}
