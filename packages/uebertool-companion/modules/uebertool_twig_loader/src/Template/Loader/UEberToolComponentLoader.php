<?php

namespace Drupal\uebertool_twig_loader\Template\Loader;

use Drupal\Core\Asset\LibraryDiscoveryInterface;
use Drupal\Core\Extension\ThemeHandlerInterface;
use Drupal\Core\Theme\ComponentPluginManager;
use Drupal\Core\Render\Component\Exception\ComponentNotFoundException;
use Drupal\Core\Template\Loader\ComponentLoader;
use Drupal\Core\Theme\ExtensionType;
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
    protected ThemeHandlerInterface $themeHandler,
  ) {}

  /**
   * {@inheritdoc}
   */
  public function getSourceContext($name): Source {
    $source = $this->prototype->getSourceContext($name);

    // Skip empty/non-existing components.
    if ($source->getCode() === '' && $source->getPath() === '') {
      return $source;
    }

    $component = $this->pluginManager->find($name);
    $pluginDefinition = $component->getPluginDefinition();
    $distThemeName = "{$pluginDefinition['provider']}_dist";

    // Only components from themes with a '_dist' theme get special treatment.
    if ($pluginDefinition['extension_type'] === ExtensionType::Theme && $this->themeHandler->themeExists($distThemeName)) {
      $componentName = $component->getDerivativeId();
      $libraryName = "sdc--{$componentName}";
      $hasLibrary = $this->libraryDiscovery->getLibraryByName($distThemeName, $libraryName);
      if ($hasLibrary) {
        $prefix = "{{ attach_library('{$distThemeName}/{$libraryName}') }}";
        $source = new Source($prefix . $source->getCode(), $source->getName(), $source->getPath());
      }
    }

    return $source;
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
