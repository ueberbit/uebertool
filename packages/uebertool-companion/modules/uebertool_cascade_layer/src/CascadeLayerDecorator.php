<?php

namespace Drupal\uebertool_cascade_layer;

use Drupal\Core\Asset\CssOptimizer;

/**
 * Optimizes a CSS asset.
 */
class CascadeLayerDecorator extends CssOptimizer {
  /**
   * {@inheritdoc}
   */
  public function optimize(array $css_asset) {
    $content = parent::optimize($css_asset);

    // Add the cascade layer to the CSS.
    $content = "@layer drupal {" . $content . "}";

    return $content;
  }

}
