<?php

declare(strict_types=1);

namespace Drupal\uebertool_companion\Hook;

use Drupal\Core\Hook\Attribute\Hook;

class PageHooks {

  #[Hook('page_attachments')]
  public function pageAttachments(array &$page): void {
    $page['#attached']['html_head'][] = [
      [
        '#tag' => 'style',
        '#value' => '@layer properties, theme, base, drupal, components, utilities;',
      ]
    ];
  }

}
