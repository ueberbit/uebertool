<?php

declare(strict_types=1);

namespace Drupal\Tests\uebertool_pswp\Kernel;

use Drupal\entity_test\Entity\EntityTest;
use Drupal\field\Entity\FieldConfig;
use Drupal\field\Entity\FieldStorageConfig;
use Drupal\file\Entity\File;
use Drupal\image\Entity\ImageStyle;
use Drupal\KernelTests\KernelTestBase;
use PHPUnit\Framework\Attributes\Group;
use PHPUnit\Framework\Attributes\RunTestsInSeparateProcesses;

/**
 * Tests the Photoswipe field formatter integration.
 */
#[Group('uebertool_pswp')]
#[RunTestsInSeparateProcesses]
final class PhotoswipeTest extends KernelTestBase {

  /**
   * {@inheritdoc}
   */
  protected static $modules = [
    'system',
    'user',
    'field',
    'file',
    'image',
    'entity_test',
    'uebertool_pswp',
  ];

  /**
   * The test entity with two images.
   */
  protected EntityTest $entity;

  /**
   * {@inheritdoc}
   */
  protected function setUp(): void {
    parent::setUp();

    $this->installEntitySchema('user');
    $this->installEntitySchema('file');
    $this->installEntitySchema('entity_test');
    $this->installSchema('file', ['file_usage']);
    $this->installConfig(['system', 'image']);
    $this->container->get('theme_installer')->install(['stark']);
    $this->config('system.theme')->set('default', 'stark')->save();

    FieldStorageConfig::create([
      'field_name' => 'field_image',
      'entity_type' => 'entity_test',
      'type' => 'image',
      'cardinality' => -1,
    ])->save();
    FieldConfig::create([
      'field_name' => 'field_image',
      'entity_type' => 'entity_test',
      'bundle' => 'entity_test',
    ])->save();

    $style = ImageStyle::create(['name' => 'pswp_test', 'label' => 'Photoswipe test']);
    $style->addImageEffect([
      'id' => 'image_scale',
      'data' => ['width' => 20, 'height' => NULL, 'upscale' => FALSE],
    ]);
    $style->save();

    // Two images with different aspect ratios.
    $images = [];
    foreach (['wide' => [80, 20], 'landscape' => [40, 30]] as $name => [$width, $height]) {
      $image = imagecreatetruecolor($width, $height);
      imagepng($image, "public://$name.png");
      $file = File::create(['uri' => "public://$name.png"]);
      $file->setPermanent();
      $file->save();
      $images[] = $file;
    }

    $this->entity = EntityTest::create(['field_image' => $images]);
    $this->entity->save();
  }

  /**
   * Renders the image field with the given Photoswipe settings.
   */
  protected function renderField(array $settings): string {
    $build = $this->entity->get('field_image')->view([
      'type' => 'image',
      'third_party_settings' => ['uebertool_pswp' => $settings],
    ]);
    return (string) $this->container->get('renderer')->renderInIsolation($build);
  }

  /**
   * Tests the dimensions without an image style.
   */
  public function testOriginalImage(): void {
    $html = $this->renderField(['pswp' => TRUE, 'pswp_style' => '']);

    // Every item is a link with its own dimensions (field--pswp.html.twig).
    $this->assertMatchesRegularExpression('#<a\s+data-pswp-width="80" data-pswp-height="20" href="[^"]*/wide\.png" target="_blank">#', $html);
    $this->assertMatchesRegularExpression('#<a\s+data-pswp-width="40" data-pswp-height="30" href="[^"]*/landscape\.png" target="_blank">#', $html);
    $this->assertStringNotContainsString('baag_dist', $html);
  }

  /**
   * Tests the dimensions with an image style.
   */
  public function testImageStyle(): void {
    $html = $this->renderField(['pswp' => TRUE, 'pswp_style' => 'pswp_test']);

    $this->assertMatchesRegularExpression('#<a\s+data-pswp-width="20" data-pswp-height="5" href="[^"]*/styles/pswp_test/public/wide\.png[^"]*"#', $html);
    $this->assertMatchesRegularExpression('#<a\s+data-pswp-width="20" data-pswp-height="15" href="[^"]*/styles/pswp_test/public/landscape\.png[^"]*"#', $html);
  }

  /**
   * Tests that the field is left alone when Photoswipe is disabled.
   */
  public function testDisabled(): void {
    $html = $this->renderField(['pswp' => FALSE, 'pswp_style' => '']);
    $this->assertStringNotContainsString('data-pswp-width', $html);
  }

  /**
   * Tests that the Photoswipe suggestions are added to the existing ones.
   */
  public function testThemeSuggestions(): void {
    $element = $this->entity->get('field_image')->view([
      'type' => 'image',
      'third_party_settings' => ['uebertool_pswp' => ['pswp' => TRUE]],
    ]);
    $variables = ['element' => $element];
    $suggestions = $this->container->get('module_handler')->invokeAll('theme_suggestions_field', [$variables]);
    $this->container->get('module_handler')->alter('theme_suggestions_field', $suggestions, $variables);

    $this->assertContains('field__entity_test__field_image', $suggestions);
    $this->assertSame(['field__pswp', 'field__pswp__field_image'], array_slice($suggestions, -2));
  }

}
