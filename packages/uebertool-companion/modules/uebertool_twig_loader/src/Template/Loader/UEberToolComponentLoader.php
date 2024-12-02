<?php

namespace Drupal\uebertool_twig_loader\Template\Loader;

use Drupal\Core\Asset\LibraryDiscoveryInterface;
use Drupal\Core\Theme\ComponentPluginManager;
use Drupal\Core\Render\Component\Exception\ComponentNotFoundException;
use Drupal\Core\Template\Loader\ComponentLoader;
use Twig\Source;
use Twig\Loader\LoaderInterface;

/**
 * Lets you load templates using the component ID.
 */
class UEberToolComponentLoader implements LoaderInterface {

  public function __construct(
    protected ComponentLoader $prototype,
    protected ComponentPluginManager $pluginManager,
    protected LibraryDiscoveryInterface $libraryDiscovery,
  ) {}

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

    $componentName = $component->getDerivativeId();
    $libraryName = "sdc--{$componentName}";

    $prefix = '';
    if (!str_starts_with($path, 'core/')) {
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
