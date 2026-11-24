<?php

declare(strict_types=1);

namespace Drupal\uebertool_cascade_layer;

use Drupal\Core\Asset\AssetOptimizerInterface;

/**
 * Wraps optimized (aggregated) CSS in the "drupal" cascade layer.
 */
class CascadeLayerDecorator implements AssetOptimizerInterface {

  public function __construct(protected AssetOptimizerInterface $prototype) {}

  /**
   * {@inheritdoc}
   */
  public function optimize(array $css_asset): string {
    $content = (string) $this->prototype->optimize($css_asset);

    // @import rules are only valid before all other rules, so they can't be
    // wrapped. The optimizer inlines local imports; the remaining (external)
    // ones are moved in front of the layer block and layered by layer().
    $imports = '';
    $content = preg_replace_callback(
      '/@import\s+(url\([^)]*\)|"[^"]*"|\'[^\']*\')([^;]*);/i',
      function (array $matches) use (&$imports): string {
        $conditions = $matches[2];
        if (!preg_match('/\blayer\b/i', $conditions)) {
          $conditions = ' layer(drupal)' . $conditions;
        }
        $imports .= "@import {$matches[1]}{$conditions};";
        return '';
      },
      $content,
    );

    return $imports . '@layer drupal{' . $content . '}';
  }

  /**
   * {@inheritdoc}
   */
  public function clean($content): string {
    return $this->prototype->clean($content);
  }

}
