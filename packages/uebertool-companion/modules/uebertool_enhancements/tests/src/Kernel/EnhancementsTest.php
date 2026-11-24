<?php

declare(strict_types=1);

namespace Drupal\Tests\uebertool_enhancements\Kernel;

use Drupal\block\Entity\Block;
use Drupal\KernelTests\KernelTestBase;
use PHPUnit\Framework\Attributes\Group;
use PHPUnit\Framework\Attributes\RunTestsInSeparateProcesses;

/**
 * Tests the UEbertool enhancements.
 */
#[Group('uebertool_enhancements')]
#[RunTestsInSeparateProcesses]
final class EnhancementsTest extends KernelTestBase {

  /**
   * {@inheritdoc}
   */
  protected static $modules = ['system', 'user', 'block', 'uebertool_enhancements'];

  /**
   * The fixtures directory, relative to the Drupal root.
   */
  protected string $fixtures;

  /**
   * {@inheritdoc}
   */
  protected function setUp(): void {
    parent::setUp();
    $this->fixtures = $this->container->get('extension.list.module')->getPath('uebertool_enhancements') . '/tests/fixtures';
  }

  /**
   * Tests reading the dimensions of SVG files.
   */
  public function testSvgDimensions(): void {
    $this->assertSame(['width' => '32', 'height' => '16'], _uebertool_enhancements_svg_dimensions("{$this->root}/{$this->fixtures}/sized.svg"));
    $this->assertSame(['width' => '24', 'height' => '12'], _uebertool_enhancements_svg_dimensions("{$this->root}/{$this->fixtures}/viewbox.svg"));
    $this->assertNull(_uebertool_enhancements_svg_dimensions("{$this->root}/{$this->fixtures}/nosize.svg"));
    $this->assertNull(_uebertool_enhancements_svg_dimensions("{$this->root}/{$this->fixtures}/broken.svg"));
    $this->assertNull(_uebertool_enhancements_svg_dimensions("{$this->root}/{$this->fixtures}/missing.svg"));
  }

  /**
   * Tests that every SVG field item is processed.
   */
  public function testSvgFieldPreprocess(): void {
    $variables = [
      'items' => [
        ['content' => ['#inline' => TRUE]],
        ['content' => ['#uri' => "{$this->root}/{$this->fixtures}/broken.svg"]],
        ['content' => ['#uri' => "{$this->root}/{$this->fixtures}/sized.svg"]],
        ['content' => ['#uri' => "{$this->root}/{$this->fixtures}/viewbox.svg", '#attributes' => ['width' => '48']]],
      ],
    ];
    uebertool_enhancements_preprocess_field__svg_image_field($variables);

    $this->assertArrayNotHasKey('#attributes', $variables['items'][0]['content']);
    $this->assertArrayNotHasKey('#attributes', $variables['items'][1]['content']);
    $this->assertSame(['width' => '32', 'height' => '16'], $variables['items'][2]['content']['#attributes']);
    // Existing attributes win.
    $this->assertSame(['width' => '48', 'height' => '12'], $variables['items'][3]['content']['#attributes']);
  }

  /**
   * Tests inlining the SVG logo.
   */
  public function testInlineSvgLogo(): void {
    $variables = [
      'plugin_id' => 'system_branding_block',
      'site_logo' => base_path() . "{$this->fixtures}/logo.svg?v=1",
    ];
    uebertool_enhancements_preprocess_block($variables);

    $svg = (string) $variables['site_logo_svg'];
    $this->assertStringStartsWith('<svg', $svg);
    $this->assertStringContainsString('viewBox="0 0 10 10"', $svg);
    $this->assertStringContainsString('<rect', $svg);
    foreach (['<script', 'onload', 'onmouseover', 'foreignObject', 'javascript:', 'alert', 'evil.example.com'] as $unsafe) {
      $this->assertStringNotContainsString($unsafe, $svg);
    }

    // The SVG is output as is, never compiled as a Twig template.
    $build = [
      '#type' => 'inline_template',
      '#template' => '{{ svg }}',
      '#context' => ['svg' => $variables['site_logo_svg']],
    ];
    $html = (string) $this->container->get('renderer')->renderInIsolation($build);
    $this->assertStringContainsString('r="{{ 7*7 }}"', $html);

    // Only local SVG files below the Drupal root are inlined.
    $this->assertNull(_uebertool_enhancements_inline_svg(base_path() . 'core/misc/druplicon.png'));
    $this->assertNull(_uebertool_enhancements_inline_svg('https://cdn.example.com' . base_path() . "{$this->fixtures}/logo.svg"));
    $this->assertNull(_uebertool_enhancements_inline_svg(base_path() . "{$this->fixtures}/missing.svg"));
    $this->assertNull(_uebertool_enhancements_inline_svg(base_path() . "{$this->fixtures}/broken.svg"));
    $this->assertNull(_uebertool_enhancements_inline_svg(base_path() . "{$this->fixtures}/../../../../../../../../etc/x.svg"));
    $this->assertNull(_uebertool_enhancements_inline_svg(base_path() . "{$this->fixtures}/%2e%2e/fixtures/logo.svg"));
  }

  /**
   * Tests the oEmbed aspect ratio with missing dimensions.
   */
  public function testOembedAspectRatio(): void {
    $variables = [
      'items' => [
        ['content' => ['#attributes' => ['width' => 16, 'height' => 9]]],
        ['content' => ['#attributes' => []]],
      ],
    ];
    uebertool_enhancements_preprocess_field__media__field_media_oembed_video__remote_video($variables);

    $this->assertSame(['aspect-ratio: 16 / 9'], $variables['items'][0]['content']['#attributes']['style']);
    $this->assertArrayNotHasKey('style', $variables['items'][1]['content']['#attributes']);
  }

  /**
   * Tests that the branding block renders the SVG logo inline.
   */
  public function testBrandingBlock(): void {
    // Provides the default logo settings.
    $this->installConfig(['system']);
    $this->container->get('theme_installer')->install(['uebertool_test']);
    $this->config('system.theme')->set('default', 'uebertool_test')->save();
    $this->container->get('theme.manager')->setActiveTheme(
      $this->container->get('theme.initialization')->initTheme('uebertool_test'),
    );

    $block = Block::create([
      'id' => 'branding',
      'theme' => 'uebertool_test',
      'region' => 'content',
      'plugin' => 'system_branding_block',
      'settings' => ['use_site_logo' => TRUE, 'use_site_name' => FALSE, 'use_site_slogan' => FALSE],
    ]);
    $block->save();

    $build = $this->container->get('entity_type.manager')->getViewBuilder('block')->view($block);
    $html = (string) $this->container->get('renderer')->renderInIsolation($build);

    $this->assertMatchesRegularExpression('#<a href="[^"]*" rel="home" class="text-white logo">\s*<svg[^>]+width="32"#', $html);
    $this->assertStringNotContainsString('<img', $html);
  }

}
