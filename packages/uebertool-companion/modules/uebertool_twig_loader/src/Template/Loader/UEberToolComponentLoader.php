<?php

namespace Drupal\uebertool_twig_loader\Template\Loader;

use Drupal\Core\Asset\LibraryDiscoveryInterface;
use Drupal\Core\Theme\ThemeManagerInterface;
use Drupal\sdc\ComponentPluginManager;
use Drupal\sdc\Exception\ComponentNotFoundException;
use Drupal\sdc\Twig\TwigComponentLoader;
use Twig\Source;
use Twig\Loader\LoaderInterface;

/**
 * Lets you load templates using the component ID.
 */
class UEberToolComponentLoader implements LoaderInterface {

  /**
   * The active theme.
   *
   * @var \Drupal\Core\Theme\ActiveTheme
   */
  protected $activeTheme;

  /**
   * The active theme name.
   *
   * @var string
   */
  protected $activeThemeName;

  public function __construct(
    protected TwigComponentLoader $prototype,
    protected ComponentPluginManager $pluginManager,
    protected ThemeManagerInterface $themeManager,
    protected LibraryDiscoveryInterface $libraryDiscovery,
  ) {
    $this->activeTheme = $this->themeManager->getActiveTheme();
    $this->activeThemeName = $this->activeTheme->getName();
  }

  /**
   * {@inheritdoc}
   */
  public function getSourceContext($name): Source {
    try {
      $component = $this->pluginManager->find($name);
      $path = $component->getTemplatePath();
      $themeName = explode($component::DERIVATIVE_SEPARATOR, $component->getPluginId())[0];
      $distThemeName = "{$themeName}_dist";
    }
    catch (ComponentNotFoundException $e) {
      return new Source('', $name, '');
    }
    $original_code = file_get_contents($path);

    $prefix = '';
    if (array_key_exists($distThemeName, $this->activeTheme->getBaseThemeExtensions())) {
      $componentName = $component->getDerivativeId();
      $libraryName = "sdc--{$componentName}";

      $prefix = $this->libraryDiscovery->getLibraryByName($distThemeName, $libraryName)
        ? "{{ attach_library('{$distThemeName}/{$libraryName}') }}"
        : '';
    }

    $code = $prefix . $original_code;
    
    return new Source($code, $name, $path);
  }

  /**
   * {@inheritdoc}
   */
  public function getCacheKey($name): string {
    return $this->prototype->getCacheKey($name);
  }

  /**
   * {@inheritdoc}
   */
  public function isFresh(string $name, int $time): bool {
    return $this->prototype->isFresh($name, $time);
  }

  /**
   * {@inheritdoc}
   */
  public function exists($name): bool {
    return $this->prototype->exists($name);
  }
}
