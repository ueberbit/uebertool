<?php

declare(strict_types=1);

namespace Drupal\Tests\uebertool_cascade_layer\Kernel;

use Drupal\KernelTests\KernelTestBase;
use PHPUnit\Framework\Attributes\Group;
use PHPUnit\Framework\Attributes\RunTestsInSeparateProcesses;

/**
 * Tests wrapping aggregated CSS in the drupal cascade layer.
 */
#[Group('uebertool_cascade_layer')]
#[RunTestsInSeparateProcesses]
final class CascadeLayerTest extends KernelTestBase {

  /**
   * {@inheritdoc}
   */
  protected static $modules = ['system', 'uebertool_cascade_layer'];

  /**
   * Tests that CSS is layered and imports stay valid.
   */
  public function testOptimize(): void {
    $path = $this->container->get('extension.list.module')->getPath('uebertool_cascade_layer') . '/tests/fixtures/style.css';
    $css = $this->container->get('asset.css.optimizer')->optimize([
      'type' => 'file',
      'data' => $path,
      'preprocess' => TRUE,
      'media' => 'all',
    ]);

    $this->assertMatchesRegularExpression(
      '#^@import url\("https://fonts\.example\.com/font\.css"\) layer\(drupal\) screen;@layer drupal\{\.a\s*\{\s*color:\s*red;?\s*\}\s*\}$#',
      $css,
    );
  }

}
