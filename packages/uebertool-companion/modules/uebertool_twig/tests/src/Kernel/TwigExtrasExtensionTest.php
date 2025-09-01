<?php

declare(strict_types=1);

namespace Drupal\Tests\uebertool_twig\Kernel;

use Drupal\Core\Template\Attribute;
use Drupal\Core\Url;
use Drupal\KernelTests\KernelTestBase;
use Drupal\uebertool_twig\Twig\Extension\TwigExtrasExtension;
use PHPUnit\Framework\Attributes\Group;
use PHPUnit\Framework\Attributes\IgnoreDeprecations;

/**
 * Test description.
 */
#[Group('uebertool_twig')]
final class TwigExtrasExtensionTest extends KernelTestBase {

  /**
   * {@inheritdoc}
   */
  protected static $modules = ['uebertool_twig'];

  protected TwigExtrasExtension $twigExtension;

  /**
   * {@inheritdoc}
   */
  protected function setUp(): void {
    parent::setUp();

    $this->twigExtension = $this->container->get('uebertool_twig.twig.extension');
  }

  /**
   * Tests linkText.
   */
  public function testLinkText(): void {
    $this->assertEmpty($this->twigExtension->linkText([]));
    $this->assertEmpty($this->twigExtension->linkText([
      '#type' => 'markup',
    ]));
    $this->assertEmpty($this->twigExtension->linkText([
      [
        '#type' => 'markup',
      ],
    ]));
    $this->assertSame('Link text', $this->twigExtension->linkText([
      '#type' => 'link',
      '#title' => 'Link text',
      '#url' => Url::fromRoute('<front>'),
    ]));
  }

  /**
   * Tests linkUrl.
   */
  public function testLinkUrl(): void {
    $this->assertEmpty($this->twigExtension->linkUrl([]));
    $this->assertEmpty($this->twigExtension->linkUrl([
      '#type' => 'markup',
    ]));
    $this->assertEmpty($this->twigExtension->linkUrl([
      [
        '#type' => 'markup',
      ],
    ]));
    $this->assertSame('https://example.com', $this->twigExtension->linkUrl([
      '#type' => 'link',
      '#title' => 'Link text',
      '#url' => Url::fromUri('https://example.com'),
    ]));

  }

  /**
   * Tests linkUrl.
   */
  public function testLinkAttributes(): void {
    $this->assertEquals(new Attribute(), $this->twigExtension->linkAttributes([]));
    $this->assertEquals(new Attribute(), $this->twigExtension->linkAttributes([
      '#type' => 'markup',
    ]));
    $this->assertEquals(new Attribute([
      'class' => [
        'foo',
      ],
    ]), $this->twigExtension->linkAttributes([
      '#type' => 'link',
      '#title' => 'Link text',
      '#url' => Url::fromUri('https://example.com'),
      '#attributes' => [
        'class' => 'foo',
      ],
    ]));

    // Collect #attributes from render array.
    $url = Url::fromUri('https://example.com');
    $this->assertEquals(new Attribute([
      'class' => [
        'foo',
      ],
    ]), $this->twigExtension->linkAttributes([
      '#type' => 'link',
      '#title' => 'Link text',
      '#url' => $url,
      '#attributes' => [
        'class' => 'foo',
      ],
    ]));
  }

  #[IgnoreDeprecations]
  public function testLinkAttributesWithUrlOptions(): void {
    // Collect attributes from link options.
    $url = Url::fromUri('https://example.com');
    $url->setOption('attributes', [
      'class' => 'foo',
      'data-foo' => 'bar',
    ]);

    $this->expectDeprecation('Handling the class attribute from the Url object is deprecated. Use $element["#attributes"] instead.');
    $this->assertEquals(new Attribute([
      'data-foo' => 'bar',
      'target' => '_blank',
      'class' => [
        'foo',
      ],
    ]), $this->twigExtension->linkAttributes([
      '#type' => 'link',
      '#title' => 'Link text',
      '#url' => $url,
      '#attributes' => [
        'target' => '_blank',
      ],
    ]));
  }

  #[IgnoreDeprecations]
  public function testLinkDeprecations() {
    $this->expectDeprecation('Calling link_text on field render array is deprecated. Use |field_value|first|link_text instead.');
    $this->assertSame('Link text', $this->twigExtension->linkText([
      [
        '#type' => 'link',
        '#title' => 'Link text',
        '#url' => Url::fromRoute('<front>'),
      ],
    ]));

    $this->expectDeprecation('Calling link_url on field render array is deprecated. Use |field_value|first|link_url instead.');
    $this->assertSame('https://example.com', $this->twigExtension->linkUrl([
      [
        '#type' => 'link',
        '#title' => 'Link text',
        '#url' => Url::fromUri('https://example.com'),
      ],
    ]));
  }

}
