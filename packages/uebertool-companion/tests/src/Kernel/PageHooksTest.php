<?php

declare(strict_types=1);

namespace Drupal\Tests\uebertool_companion\Kernel;

use Drupal\KernelTests\KernelTestBase;
use PHPUnit\Framework\Attributes\Group;
use PHPUnit\Framework\Attributes\RunTestsInSeparateProcesses;

/**
 * Tests the cascade layer order added to every page.
 */
#[Group('uebertool_companion')]
#[RunTestsInSeparateProcesses]
final class PageHooksTest extends KernelTestBase {

  /**
   * {@inheritdoc}
   */
  protected static $modules = ['system', 'uebertool_companion'];

  /**
   * Tests that the layer order is attached.
   */
  public function testLayerOrderIsAttached(): void {
    $page = [];
    $this->container->get('module_handler')->invokeAllWith(
      'page_attachments',
      function (callable $hook) use (&$page): void {
        $hook($page);
      },
    );

    $this->assertContains([
      [
        '#tag' => 'style',
        '#value' => '@layer properties, theme, base, drupal, components, components-custom, utilities;',
      ],
      'uebertool_companion_layer',
    ], $page['#attached']['html_head']);
  }

}
