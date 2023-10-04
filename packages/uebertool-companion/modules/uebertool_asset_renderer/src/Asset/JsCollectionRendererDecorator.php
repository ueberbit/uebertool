<?php

namespace Drupal\uebertool_asset_renderer\Asset;

use Drupal\Core\Asset\AssetCollectionRendererInterface;

/**
 * Optimizes a JS asset.
 */
class JsCollectionRendererDecorator implements AssetCollectionRendererInterface {

  public function __construct(protected AssetCollectionRendererInterface $prototype) {}

  /**
   * {@inheritdoc}
   */
  public function render(array $js_assets) {
    foreach ($js_assets as &$js_asset) {
      if (isset($js_asset['noquery'])) {
        // Setting preprocessed to TRUE will prevent Drupal from prepending the querystring.
        $js_asset['preprocessed'] = TRUE;
      }
    }

    $elements = $this->prototype->render($js_assets);

    return $elements;
  }

}
