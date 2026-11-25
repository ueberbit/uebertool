<?php

declare(strict_types=1);

namespace Drupal\uebertool_companion\Hook;

use Drupal\Core\Asset\AttachedAssetsInterface;
use Drupal\Core\Hook\Attribute\Hook;
use Drupal\Core\Hook\Order\Order;
use Drupal\Core\Language\LanguageInterface;
use Drupal\Core\Theme\ThemeManagerInterface;

/**
 * Lets locale find translatable strings in the theme's source files.
 *
 * Locale only scans library JS of type "file", i.e. the built entries. Chunks
 * loaded with import() are in no library, and in dev all JS is external.
 * vite-plugin-drupal lists the sources that call Drupal.t() or
 * Drupal.formatPlural() in "translations.json" of the dist theme.
 */
class TranslationHooks {

  /**
   * The asset locale replaces with the translation file.
   */
  const PLACEHOLDER = 'core/modules/locale/locale.translation.js';

  public function __construct(protected ThemeManagerInterface $themeManager) {}

  /**
   * Implements hook_js_alter().
   *
   * Runs before locale_js_alter(), which builds the translation file.
   */
  #[Hook('js_alter', order: Order::First)]
  public function jsAlter(array &$javascript, AttachedAssetsInterface $assets, LanguageInterface $language): void {
    // Locale only adds the placeholder if it is enabled.
    if (!isset($javascript[self::PLACEHOLDER])) {
      return;
    }

    $theme = $this->themeManager->getActiveTheme();
    $paths = [$theme->getPath()];
    foreach ($theme->getBaseThemeExtensions() as $base_theme) {
      $paths[] = $base_theme->getPath();
    }

    $files = [];
    foreach ($paths as $path) {
      $manifest = $path . '/translations.json';
      if (!is_file($manifest)) {
        continue;
      }
      $data = json_decode(file_get_contents($manifest), TRUE) ?: [];
      $root = $this->resolve($path, $data['root'] ?? '.');
      foreach ($data['files'] ?? [] as $file) {
        $source = $root . '/' . $file;
        // Locale never parses a path twice. The content hash turns a changed
        // file into a new path; locale strips the query before reading it.
        // This hook runs when the asset resolver cache is rebuilt, so edits
        // are picked up after a cache clear.
        if (is_file($source)) {
          $files[] = $source . '?' . hash_file('xxh128', $source);
        }
      }
    }

    if ($files) {
      locale_js_translate($files, $language);
    }
  }

  /**
   * Resolves a relative path like "..", without making it absolute.
   */
  protected function resolve(string $path, string $relative): string {
    foreach (explode('/', $relative) as $segment) {
      $path = match ($segment) {
        '', '.' => $path,
        '..' => dirname($path),
        default => $path . '/' . $segment,
      };
    }
    return $path;
  }

}
