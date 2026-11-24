<?php

declare(strict_types=1);

namespace Drupal\Tests\uebertool_asset_renderer\Kernel;

use Drupal\KernelTests\KernelTestBase;
use PHPUnit\Framework\Attributes\Group;
use PHPUnit\Framework\Attributes\RunTestsInSeparateProcesses;

/**
 * Tests rendering assets without the cache busting query string.
 */
#[Group('uebertool_asset_renderer')]
#[RunTestsInSeparateProcesses]
final class AssetRendererTest extends KernelTestBase {

  /**
   * {@inheritdoc}
   */
  protected static $modules = ['system', 'uebertool_asset_renderer'];

  /**
   * Builds a file asset.
   */
  protected function asset(string $data, array $extra = []): array {
    return $extra + [
      'type' => 'file',
      'data' => $data,
      'media' => 'all',
      'preprocess' => FALSE,
      'version' => -1,
      'cache' => TRUE,
      'attributes' => [],
    ];
  }

  /**
   * Tests CSS assets.
   */
  public function testCss(): void {
    $elements = $this->container->get('asset.css.collection_renderer')->render([
      $this->asset('core/misc/a.css', ['noquery' => TRUE]),
      $this->asset('core/misc/b.css', ['noquery' => FALSE]),
      $this->asset('core/misc/c.css'),
    ]);

    $this->assertStringEndsWith('core/misc/a.css', $elements[0]['#attributes']['href']);
    $this->assertStringContainsString('core/misc/b.css?', $elements[1]['#attributes']['href']);
    $this->assertStringContainsString('core/misc/c.css?', $elements[2]['#attributes']['href']);
  }

  /**
   * Tests JS assets.
   */
  public function testJs(): void {
    $elements = $this->container->get('asset.js.collection_renderer')->render([
      $this->asset('core/misc/a.js', ['noquery' => TRUE]),
      $this->asset('core/misc/b.js'),
    ]);

    $this->assertStringEndsWith('core/misc/a.js', $elements[0]['#attributes']['src']);
    $this->assertStringContainsString('core/misc/b.js?', $elements[1]['#attributes']['src']);
  }

}
