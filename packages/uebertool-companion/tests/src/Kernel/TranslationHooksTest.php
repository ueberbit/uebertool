<?php

declare(strict_types=1);

namespace Drupal\Tests\uebertool_companion\Kernel;

use Drupal\Core\Asset\AttachedAssets;
use Drupal\KernelTests\KernelTestBase;
use PHPUnit\Framework\Attributes\Group;
use PHPUnit\Framework\Attributes\RunTestsInSeparateProcesses;

/**
 * Tests that locale parses the source files listed by vite-plugin-drupal.
 */
#[Group('uebertool_companion')]
#[RunTestsInSeparateProcesses]
final class TranslationHooksTest extends KernelTestBase {

  /**
   * {@inheritdoc}
   */
  protected static $modules = [
    'system',
    'language',
    'locale',
    'uebertool_companion',
  ];

  /**
   * {@inheritdoc}
   */
  protected function setUp(): void {
    parent::setUp();

    $this->installSchema('locale', ['locales_source', 'locales_target', 'locales_location']);
    $this->installConfig(['language', 'locale']);

    $this->container->get('theme_installer')->install(['uebertool_test']);
    $this->container->get('theme.manager')->setActiveTheme(
      $this->container->get('theme.initialization')->initTheme('uebertool_test'),
    );
  }

  /**
   * Resolves the JS assets of a page with core/drupal.
   */
  protected function resolveJs(): void {
    $assets = AttachedAssets::createFromRenderArray([
      '#attached' => ['library' => ['core/drupal']],
    ]);
    $this->container->get('asset.resolver')->getJsAssets(
      $assets,
      FALSE,
      $this->container->get('language_manager')->getCurrentLanguage(),
    );
  }

  /**
   * Tests that listed sources are parsed with their content hash.
   */
  public function testSourcesAreParsed(): void {
    $this->resolveJs();

    $source = $this->container->get('extension.list.theme')->getPath('uebertool_test') . '/js/main.js';
    $parsed = $this->container->get('state')->get('system.javascript_parsed', []);
    $this->assertContains($source . '?' . hash_file('xxh128', $source), $parsed);

    $string = $this->container->get('locale.storage')->findString([
      'source' => 'Hello from source',
      'context' => 'uebertool',
    ]);
    $this->assertNotNull($string);

    // Missing files in the manifest are skipped.
    $this->assertEmpty(array_filter($parsed, fn ($path) => is_string($path) && str_contains($path, 'missing.js')));
  }

}
