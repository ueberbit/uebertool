<?php

declare(strict_types=1);

namespace Drupal\uebertool_docs_pages;

use Drupal\Core\Extension\ModuleExtensionList;
use Drupal\Core\Serialization\Yaml;

/**
 * Reads the docs sidebar from uebertool_docs_pages.navigation.yml.
 */
final class DocsNavigation {

  /**
   * The parsed navigation.
   */
  private array $groups;

  public function __construct(ModuleExtensionList $moduleList) {
    $file = $moduleList->getPath('uebertool_docs_pages') . '/uebertool_docs_pages.navigation.yml';
    $this->groups = Yaml::decode((string) file_get_contents($file)) ?? [];
  }

  /**
   * Returns the sidebar groups.
   */
  public function groups(): array {
    return $this->groups;
  }

  /**
   * Returns all pages keyed by slug, in sidebar order.
   */
  public function pages(): array {
    $pages = [];
    foreach ($this->groups as $group) {
      foreach ($group['items'] as $slug => $item) {
        $pages[$slug] = $item + ['slug' => $slug, 'group' => $group['label']];
      }
    }
    return $pages;
  }

  /**
   * Returns a single page or NULL.
   */
  public function page(string $slug): ?array {
    return $this->pages()[$slug] ?? NULL;
  }

}
