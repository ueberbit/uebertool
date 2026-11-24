<?php

declare(strict_types=1);

namespace Drupal\uebertool_twig_loader\Template\Loader;

use Drupal\Core\Asset\LibraryDiscoveryInterface;
use Drupal\Core\Routing\AdminContext;
use Drupal\Core\Theme\ThemeManagerInterface;
use Twig\Error\LoaderError;
use Twig\Loader\FilesystemLoader;
use Twig\Source;

/**
 * Filesystem loader that automatically attaches a template's library.
 *
 * A template "foo.html.twig" of the active theme gets the library "foo" of
 * the theme's "<theme>_dist" base theme (or of another base theme) attached.
 */
class UEberToolFilesystemLoader extends FilesystemLoader {

  /**
   * The name of the theme whose template paths are currently registered.
   */
  protected ?string $registeredThemeName = NULL;

  public function __construct(
    protected ThemeManagerInterface $themeManager,
    protected LibraryDiscoveryInterface $libraryDiscovery,
    protected AdminContext $adminContext,
    protected string $root,
  ) {
    parent::__construct([], $root);
    $this->addPath('.', self::MAIN_NAMESPACE);
  }

  /**
   * {@inheritdoc}
   */
  protected function findTemplate(string $name, bool $throw = TRUE): ?string {
    if ($this->adminContext->isAdminRoute()) {
      if (!$throw) {
        return NULL;
      }
      throw new LoaderError('Skipping admin route');
    }
    $this->ensurePaths();
    return parent::findTemplate($name, $throw);
  }

  /**
   * Registers the template paths of the active theme and its base themes.
   *
   * Runs lazily, because the active theme is not negotiated yet when the
   * loader is constructed, and re-registers when the active theme changes
   * within a request (e.g. search_api's ThemeSwitcher).
   */
  protected function ensurePaths(): void {
    $activeTheme = $this->themeManager->getActiveTheme();
    if ($activeTheme->getName() === $this->registeredThemeName) {
      return;
    }

    $this->paths = array_intersect_key($this->paths, [self::MAIN_NAMESPACE => TRUE]);
    $this->cache = $this->errorCache = [];

    $themes = [$activeTheme->getName() => $activeTheme->getPath()];
    foreach ($activeTheme->getBaseThemeExtensions() as $baseTheme) {
      $themes[$baseTheme->getName()] = $baseTheme->getPath();
    }
    foreach ($themes as $themeName => $themePath) {
      if (is_dir($this->root . '/' . $themePath . '/templates')) {
        $this->addPath($themePath . '/templates', $themeName);
      }
    }

    $this->registeredThemeName = $activeTheme->getName();
  }

  /**
   * {@inheritdoc}
   *
   * The source depends on the active theme (it decides which library is
   * attached), and core's filesystem loader returns the same key for the
   * same file. Without a key of our own, both loaders and all themes would
   * share one compiled template.
   */
  public function getCacheKey(string $name): string {
    return 'uebertool:' . $this->themeManager->getActiveTheme()->getName() . ':' . parent::getCacheKey($name);
  }

  /**
   * {@inheritdoc}
   */
  public function getSourceContext(string $name): Source {
    $path = $this->findTemplate($name);
    if ($path === NULL) {
      return new Source('', $name, '');
    }

    return new Source($this->libraryPrefix($name) . file_get_contents($path), $name, $path);
  }

  /**
   * Builds the attach_library() call for a template, if it has a library.
   */
  protected function libraryPrefix(string $name): string {
    $activeTheme = $this->themeManager->getActiveTheme();
    $baseThemes = $activeTheme->getBaseThemeExtensions();
    $distThemeName = "{$activeTheme->getName()}_dist";

    if (!array_key_exists($distThemeName, $baseThemes)) {
      return '';
    }

    $libraryName = str_starts_with($name, '@')
      ? preg_replace('/@((\w|-)+\/)+|((\.html)?\.twig)/', '', $name)
      : preg_replace('/((\w|-)+\/)|((\.html)?\.twig)$/', '', $name);

    $extensions = [$distThemeName, ...array_keys($baseThemes)];
    foreach (array_unique($extensions) as $extension) {
      if ($this->libraryDiscovery->getLibraryByName($extension, $libraryName)) {
        return "{{ attach_library('{$extension}/{$libraryName}') }}";
      }
    }

    return '';
  }

}
