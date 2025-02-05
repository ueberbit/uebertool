<?php

declare(strict_types=1);

namespace Drupal\Tests\uebertool_twig\Kernel;

use Drupal\Core\Template\Attribute;
use Drupal\KernelTests\KernelTestBase;
use Drupal\purl\Url;
use Drupal\uebertool_twig\Twig\Extension\TwigExtrasExtension;
use PHPUnit\Framework\Attributes\Group;

/**
 * Test description.
 */
#[Group('uebertool_twig')]
final class TestTwigExtrasExtension extends KernelTestBase {

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
    $this->assertSame('Link text', $this->twigExtension->linkText([
      [
        '#type' => 'link',
        '#title' => 'Link text',
        '#url' => Url::fromRoute('<front>'),
      ],
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
    $this->assertSame('https://example.com', $this->twigExtension->linkUrl([
      [
        '#type' => 'link',
        '#title' => 'Link text',
        '#url' => Url::fromUri('https://example.com'),
      ],
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

    // Collect attributes from link options.
    $url = Url::fromUri('https://example.com');
    $url->setOption('attributes', [
      'class' => 'foo',
      'data-foo' => 'bar',
    ]);
    $this->assertEquals(new Attribute([
      'class' => [
        'foo',
      ],
      'data-foo' => 'bar',
      'target' => '_blank',
    ]), $this->twigExtension->linkAttributes([
      '#type' => 'link',
      '#title' => 'Link text',
      '#url' => $url,
      '#attributes' => [
        'target' => '_blank',
      ],
    ]));
  }

}
