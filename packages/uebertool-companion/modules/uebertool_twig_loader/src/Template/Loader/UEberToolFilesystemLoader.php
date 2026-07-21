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

  public function getSourceContext(string $name): Source {
    if (\Drupal::service('router.admin_context')->isAdminRoute()) {
      throw new LoaderError('Skipping admin route');
    }
    $activeTheme = $this->themeManager->getActiveTheme();
    $activeThemeName = $activeTheme->getName();
    $distThemeName = "{$activeThemeName}_dist";

    file_exists($activeTheme->getPath() . '/templates') && $this->addPath($activeTheme->getPath() . '/templates', $activeThemeName);
    foreach ($activeTheme->getBaseThemeExtensions() as $baseTheme) {
      $path = $baseTheme->getPath() . '/templates';
      file_exists($path) && $this->addPath($path, $baseTheme->getName());
    }

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

    if (null === ($path = $this->findTemplate($name)) || false === $path) {
      return new Source('', $name, '');
    }

    return new Source($prefix . file_get_contents($path), $name, $path);
  }
}
