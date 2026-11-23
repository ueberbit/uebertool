<?php

declare(strict_types=1);

namespace Drupal\uebertool_docs_pages\Hook;

use Drupal\Core\Hook\Attribute\Hook;

/**
 * Theme hooks of the docs.
 */
final class DocsHooks {

  #[Hook('theme')]
  public function theme(): array {
    return [
      'uebertool_docs_page' => [
        'variables' => ['slug' => NULL, 'description' => ''],
      ],
      'uebertool_docs_preview' => [
        'variables' => ['demo' => NULL],
      ],
    ];
  }

}
