<?php

namespace Drupal\uebertool_asset_renderer\Asset;

use Drupal\Core\Asset\AssetCollectionRendererInterface;

/**
 * Optimizes a CSS asset.
 */
class CssCollectionRendererDecorator implements AssetCollectionRendererInterface {

  public function __construct(protected AssetCollectionRendererInterface $prototype) {}

  /**
   * {@inheritdoc}
   */
  public function render(array $css_assets) {
    foreach ($css_assets as &$css_asset) {
      if (isset($css_asset['noquery'])) {
        // Setting preprocessed to TRUE will prevent Drupal from prepending the querystring.
        $css_asset['preprocessed'] = TRUE;
      }
    }

    $elements = $this->prototype->render($css_assets);

    return $elements;
  }

}
