<?php

declare(strict_types=1);

namespace Drupal\Tests\uebertool_twig\Kernel;

use Drupal\Core\Template\Attribute;
use Drupal\Core\Url;
use Drupal\entity_test\Entity\EntityTest;
use Drupal\field\Entity\FieldConfig;
use Drupal\field\Entity\FieldStorageConfig;
use Drupal\file\Entity\File;
use Drupal\KernelTests\KernelTestBase;
use Drupal\uebertool_twig\Twig\Extension\TwigExtrasExtension;
use PHPUnit\Framework\Attributes\Group;
use PHPUnit\Framework\Attributes\IgnoreDeprecations;
use PHPUnit\Framework\Attributes\RunTestsInSeparateProcesses;

/**
 * Test description.
 */
#[Group('uebertool_twig')]
#[RunTestsInSeparateProcesses]
final class TwigExtrasExtensionTest extends KernelTestBase {

  /**
   * {@inheritdoc}
   */
  protected static $modules = [
    'uebertool_companion',
    'uebertool_twig',
    'system',
    'user',
    'field',
    'file',
    'entity_test',
    'link',
  ];

  /**
   * The Twig extension under test.
   */
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

  /**
   * Tests linkUrl, with <none>, <nolink> and <button> routes.
   */
  public function testLinkAttributeForSpecialRoutes(): void {
    // Collect #attributes from render array. Url with <none>.
    $url = Url::fromRoute('<none>');
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

    // Collect #attributes from render array. Url with <nolink>.
    $url = Url::fromRoute('<nolink>');
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

    // Collect #attributes from render array. Url with <button>.
    $url = Url::fromRoute('<button>');
    $this->assertEquals(new Attribute([
      'class' => [
        'foo',
      ],
      'type' => 'button',
    ]), $this->twigExtension->linkAttributes([
      '#type' => 'link',
      '#title' => 'Link text',
      '#url' => $url,
      '#attributes' => [
        'class' => 'foo',
      ],
    ]));
  }

  /**
   * Tests the deprecated class handling of Url options in linkAttributes.
   */
  #[IgnoreDeprecations]
  public function testLinkAttributesWithUrlOptions(): void {
    // Collect attributes from link options.
    $url = Url::fromUri('https://example.com');
    $url->setOption('attributes', [
      'class' => 'foo',
      'data-foo' => 'bar',
    ]);

    $this->expectDeprecation('Handling the class attribute from the Url object in link_attrs is deprecated in uebertool_companion:0.7.5 and is removed from uebertool_companion:1.0.0. Use $element["#attributes"] instead. See https://www.drupal.org/node/3494015');
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

  /**
   * Tests the deprecated field render array handling of the link filters.
   */
  #[IgnoreDeprecations]
  public function testLinkDeprecations(): void {
    $this->expectDeprecation('Calling link_text on a field render array is deprecated in uebertool_companion:0.6.0 and is removed from uebertool_companion:1.0.0. Use |field_value|first|link_text instead. See https://github.com/ueberbit/uebertool/tree/main/packages/uebertool-companion/modules/uebertool_twig#deprecations');
    $this->assertSame('Link text', $this->twigExtension->linkText([
      [
        '#type' => 'link',
        '#title' => 'Link text',
        '#url' => Url::fromRoute('<front>'),
      ],
    ]));

    $this->expectDeprecation('Calling link_url on a field render array is deprecated in uebertool_companion:0.6.0 and is removed from uebertool_companion:1.0.0. Use |field_value|first|link_url instead. See https://github.com/ueberbit/uebertool/tree/main/packages/uebertool-companion/modules/uebertool_twig#deprecations');
    $this->assertSame('https://example.com', $this->twigExtension->linkUrl([
      [
        '#type' => 'link',
        '#title' => 'Link text',
        '#url' => Url::fromUri('https://example.com'),
      ],
    ]));
  }

  /**
   * Builds a link render array.
   */
  protected function link(array $attributes = []): array {
    return [
      '#type' => 'link',
      '#title' => 'Link text',
      '#url' => Url::fromUri('https://example.com'),
      '#attributes' => $attributes,
    ];
  }

  /**
   * Tests the button() function.
   */
  public function testButton(): void {
    $button = $this->twigExtension->getButton($this->link(), 'primary');
    $this->assertSame(['button', 'button--primary'], $button['#attributes']['class']);

    // An empty variant adds only the base class.
    $button = $this->twigExtension->getButton($this->link(['class' => ['foo']]), '');
    $this->assertSame(['foo', 'button'], $button['#attributes']['class']);
    $button = $this->twigExtension->getButton($this->link(), NULL);
    $this->assertSame(['button'], $button['#attributes']['class']);

    // A field render array returns its first link.
    $field = ['#theme' => 'field', 0 => $this->link(), 1 => $this->link()];
    $button = $this->twigExtension->getButton($field, 'secondary');
    $this->assertSame(['button', 'button--secondary'], $button['#attributes']['class']);

    $this->assertNull($this->twigExtension->getButton(NULL));
    $this->assertNull($this->twigExtension->getButton(['#type' => 'markup']));

    // The Url object is left alone, the classes end up in the markup.
    $link = $this->link();
    $button = $this->twigExtension->getButton($link, 'primary');
    $this->assertSame([], $link['#url']->getOption('attributes') ?? []);
    $html = (string) $this->container->get('renderer')->renderInIsolation($button);
    $this->assertStringContainsString('class="button button--primary"', $html);
  }

  /**
   * Tests the buttons() function.
   */
  public function testButtons(): void {
    $field = ['#theme' => 'field', 0 => $this->link(), 1 => $this->link(), 2 => $this->link()];

    $buttons = $this->twigExtension->getButtons($field, 'primary');
    $this->assertSame(['button', 'button--primary'], $buttons[0]['#attributes']['class']);
    $this->assertSame(['button', 'button--primary'], $buttons[2]['#attributes']['class']);

    // Variants per delta, missing ones fall back to the base class.
    $buttons = $this->twigExtension->getButtons($field, ['primary', 'secondary']);
    $this->assertSame(['button', 'button--primary'], $buttons[0]['#attributes']['class']);
    $this->assertSame(['button', 'button--secondary'], $buttons[1]['#attributes']['class']);
    $this->assertSame(['button'], $buttons[2]['#attributes']['class']);

    // A single link is styled as well.
    $buttons = $this->twigExtension->getButtons($this->link(), 'primary');
    $this->assertSame(['button', 'button--primary'], $buttons['#attributes']['class']);

    $this->assertNull($this->twigExtension->getButtons(NULL));
  }

  /**
   * Tests that button and buttons are registered once.
   */
  public function testFunctionsAreUnique(): void {
    $names = array_map(fn($function) => $function->getName(), $this->twigExtension->getFunctions());
    $this->assertSame(array_unique($names), $names);
  }

  /**
   * Tests the file_size and file_mime filters.
   */
  public function testFileFilters(): void {
    $this->installEntitySchema('user');
    $this->installEntitySchema('file');
    $this->installEntitySchema('entity_test');
    $this->installSchema('file', ['file_usage']);

    FieldStorageConfig::create([
      'field_name' => 'field_file',
      'entity_type' => 'entity_test',
      'type' => 'file',
    ])->save();
    FieldConfig::create([
      'field_name' => 'field_file',
      'entity_type' => 'entity_test',
      'bundle' => 'entity_test',
    ])->save();

    file_put_contents('public://document.pdf', str_repeat('a', 2048));
    $file = File::create(['uri' => 'public://document.pdf']);
    $file->setPermanent();
    $file->save();

    $entity = EntityTest::create(['field_file' => [$file]]);
    $entity->save();
    $build = $entity->get('field_file')->view();

    $this->assertSame('2 KB', (string) $this->twigExtension->fileSize($build));
    $this->assertSame('PDF', $this->twigExtension->mimeType($build));

    // Anything that isn't a file field returns an empty string.
    foreach ([NULL, [], ['#theme' => 'field'], ['#field_type' => 'string']] as $invalid) {
      $this->assertSame('', $this->twigExtension->fileSize($invalid));
      $this->assertSame('', $this->twigExtension->mimeType($invalid));
    }
  }

  /**
   * Tests the languages() function.
   */
  public function testLanguages(): void {
    $languages = $this->twigExtension->getLanguages();
    $this->assertSame(['en'], array_keys($languages));
    $this->assertTrue($languages['en']['active']);

    // Unknown langcodes return the current language.
    $this->assertSame('en', $this->twigExtension->getLanguages('xx')['id']);
  }

  /**
   * Tests that HTML() accepts empty values.
   */
  public function testHtml(): void {
    $this->assertSame(['#markup' => ''], $this->twigExtension->html(NULL));
    $this->assertSame(['#markup' => '<b>x</b>'], $this->twigExtension->html('<b>x</b>'));
  }

  /**
   * Tests the class() function.
   */
  public function testClassList(): void {
    $this->assertSame(' class="a b"', (string) $this->twigExtension->classList(['a', 'b']));
  }

  /**
   * Tests that field_empty/field_isset accept missing fields.
   */
  public function testFieldEmpty(): void {
    $this->assertTrue($this->twigExtension->fieldEmptyFilter(NULL));
    $this->assertTrue($this->twigExtension->fieldEmptyFilter(['#theme' => 'field']));
    $this->assertTrue($this->twigExtension->fieldIssetFilter(['#theme' => 'field', 0 => ['#markup' => 'x']]));
  }

  /**
   * Tests buttons() on the output of the link formatter.
   */
  public function testButtonsOnLinkField(): void {
    $this->installEntitySchema('user');
    $this->installEntitySchema('entity_test');
    FieldStorageConfig::create([
      'field_name' => 'field_link',
      'entity_type' => 'entity_test',
      'type' => 'link',
      'cardinality' => -1,
    ])->save();
    FieldConfig::create([
      'field_name' => 'field_link',
      'entity_type' => 'entity_test',
      'bundle' => 'entity_test',
    ])->save();

    $entity = EntityTest::create([
      'field_link' => [
        ['uri' => 'https://example.com/a', 'title' => 'A', 'options' => ['attributes' => ['class' => ['existing']]]],
        ['uri' => 'https://example.com/b', 'title' => 'B'],
      ],
    ]);
    $entity->save();

    $build = $entity->get('field_link')->view([
      'type' => 'link',
      'settings' => ['rel' => 'nofollow', 'target' => '_blank'],
    ]);
    $buttons = $this->twigExtension->getButtons($build, ['primary', 'secondary']);
    $html = (string) $this->container->get('renderer')->renderInIsolation($buttons);

    $this->assertMatchesRegularExpression('#<a href="https://example.com/a"[^>]*class="existing button button--primary"#', $html);
    $this->assertMatchesRegularExpression('#<a href="https://example.com/b"[^>]*class="button button--secondary"#', $html);
    $this->assertStringContainsString('rel="nofollow"', $html);
    $this->assertStringContainsString('target="_blank"', $html);
  }

}
