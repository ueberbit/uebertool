<?php

namespace Drupal\uebertool_cascade_layer;

use Drupal\Core\Asset\AssetOptimizerInterface;

/**
 * Optimizes a CSS asset.
 */
class CascadeLayerDecorator implements AssetOptimizerInterface {

  public function __construct(protected AssetOptimizerInterface $prototype) {}

  /**
   * {@inheritdoc}
   */
  public function optimize(array $css_asset) {
    $content = $this->prototype->optimize($css_asset);

    // Add the cascade layer to the CSS.
    $content = "@layer drupal {" . $content . "}";

    return $content;
  }

  /**
   * {@inheritdoc}
   */
  public function clean($content) {
    return $this->prototype->clean($content);
  }

}
