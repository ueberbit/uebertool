<?php

declare(strict_types=1);

namespace Drupal\uebertool_docs_pages;

use Drupal\Core\Extension\ThemeExtensionList;
use Drupal\uebertool_docs_pages\Markdown\DocsMarkdown;

/**
 * Builds the docs sidebar from the layout of the theme's docs/ folder.
 *
 * docs/NN-group/README.md is a group, its front matter title the label.
 * docs/NN-group/NN-slug.md is a page with the URL /uebertool/slug. The numeric
 * prefixes set the order and are not part of the slug.
 */
final class DocsNavigation {

  /**
   * The sidebar groups, built on first use.
   */
  private ?array $groups = NULL;

  public function __construct(
    private readonly ThemeExtensionList $themes,
    private readonly DocsMarkdown $markdown,
  ) {}

  /**
   * Returns the sidebar groups: label and items keyed by slug.
   *
   * Each item has the front matter of the page plus its file.
   */
  public function groups(): array {
    if ($this->groups !== NULL) {
      return $this->groups;
    }

    $this->groups = [];
    $files = [];
    $root = $this->themes->getPath('uebertool_docs') . '/docs';
    foreach (glob("$root/[0-9]*-*", GLOB_ONLYDIR) as $dir) {
      $items = [];
      foreach (glob("$dir/[0-9]*-*.md") as $file) {
        $slug = (string) preg_replace('/^\d+-/', '', basename($file, '.md'));
        if (isset($files[$slug])) {
          throw new \LogicException("Docs slug $slug is used by $files[$slug] and $file.");
        }
        $files[$slug] = $file;
        $items[$slug] = ['file' => $file] + $this->markdown->frontMatter($file);
      }
      $readme = "$dir/README.md";
      $this->groups[] = [
        'label' => (is_file($readme) ? $this->markdown->frontMatter($readme)['title'] ?? NULL : NULL) ?? basename($dir),
        'items' => $items,
      ];
    }
    return $this->groups;
  }

  /**
   * Returns all pages keyed by slug, in sidebar order.
   */
  public function pages(): array {
    $pages = [];
    foreach ($this->groups() as $group) {
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
