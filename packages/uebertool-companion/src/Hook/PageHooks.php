<?php

declare(strict_types=1);

namespace Drupal\uebertool_companion\Hook;

use Drupal\Core\Hook\Attribute\Hook;

/**
 * Page hook implementations for uebertool_companion.
 */
class PageHooks {

  /**
   * Implements hook_page_attachments().
   *
   * Declares the cascade layer order before any stylesheet is loaded.
   */
  #[Hook('page_attachments')]
  public function pageAttachments(array &$page): void {
    $page['#attached']['html_head'][] = [
      [
        '#tag' => 'style',
        '#value' => '@layer properties, theme, base, drupal, components, components-custom, utilities;',
      ],
      'uebertool_companion_layer',
    ];
  }

}
