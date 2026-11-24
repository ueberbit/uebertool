<?php

namespace Drupal\uebertool_twig_loader\Template\Loader;

use Twig\Source;
use Twig\Error\LoaderError;
use Twig\Loader\FilesystemLoader;
use Drupal\Core\Theme\ThemeManagerInterface;
use Drupal\Core\Asset\LibraryDiscoveryInterface;

/**
 * Filesystem loader that will automagically attach libraries
 */
class UEberToolFilesystemLoader extends FilesystemLoader {

  /**
   * Provides a high level access to the active theme and methods to use it.
   *
   * @var \Drupal\Core\Theme\ThemeManagerInterface
   */
  protected $themeManager;

  /**
   * The library discovery service.
   *
   * @var \Drupal\Core\Asset\LibraryDiscoveryInterface
   */
  protected $libraryDiscovery;

  /**
   * The name of the theme whose template paths are currently registered.
   *
   * @var string|null
   */
  protected $registeredThemeName = NULL;

  /**
   * Constructs a new ComponentsLoader object.
   */
  public function __construct(
    ThemeManagerInterface $themeManager,
    LibraryDiscoveryInterface $library_discovery,
  ) {
    parent::__construct([], null);
    $this->themeManager = $themeManager;
    $this->libraryDiscovery = $library_discovery;
    $this->addPath('.', '__main__');
  }

  /**
   * {@inheritdoc}
   */
  protected function findTemplate(string $name, bool $throw = TRUE) {
    if (\Drupal::service('router.admin_context')->isAdminRoute()) {
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
      file_exists($themePath . '/templates') && $this->addPath($themePath . '/templates', $themeName);
    }

    $this->registeredThemeName = $activeTheme->getName();
  }

  public function getSourceContext(string $name): Source {
    if (null === ($path = $this->findTemplate($name)) || false === $path) {
      return new Source('', $name, '');
    }

    $activeTheme = $this->themeManager->getActiveTheme();
    $distThemeName = "{$activeTheme->getName()}_dist";

    $prefix = '';

    if (array_key_exists($distThemeName, $activeTheme->getBaseThemeExtensions())) {
      if (str_starts_with($name, '@')) {
        $libraryName = preg_replace('/@((\w|-)+\/)+|((\.html)?\.twig)/', '', $name);
      }
      else {
        $libraryName = preg_replace('/((\w|-)+\/)|((\.html)?\.twig)$/', '', $name);
      }

      $extension = FALSE;
      $libraryExists = $this->libraryDiscovery->getLibraryByName($distThemeName, $libraryName);
      if ($libraryExists) {
        $extension = $distThemeName;
      }
      else {
        foreach ($activeTheme->getBaseThemeExtensions() as $baseTheme) {
          if ($this->libraryDiscovery->getLibraryByName($baseTheme->getName(), $libraryName)) {
            $extension = $baseTheme->getName();
            break;
          }
        }
      }

      $prefix = $extension
        ? "{{ attach_library('{$extension}/{$libraryName}') }}"
        : '';
    }

    return new Source($prefix . file_get_contents($path), $name, $path);
  }
}
