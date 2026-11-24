<?php

declare(strict_types=1);

namespace Drupal\uebertool_asset_renderer\Asset;

use Drupal\Core\Asset\AssetCollectionRendererInterface;

/**
 * Renders JS assets without the cache busting query string if asked to.
 *
 * Libraries opt in with "noquery: true" on an asset, e.g. for files whose
 * names already contain a content hash.
 */
class JsCollectionRendererDecorator implements AssetCollectionRendererInterface {

  public function __construct(protected AssetCollectionRendererInterface $prototype) {}

  /**
   * {@inheritdoc}
   */
  public function render(array $js_assets): array {
    foreach ($js_assets as &$js_asset) {
      if (!empty($js_asset['noquery'])) {
        // Drupal doesn't append the query string to preprocessed assets.
        $js_asset['preprocessed'] = TRUE;
      }
    }

    return $this->prototype->render($js_assets);
  }

}
