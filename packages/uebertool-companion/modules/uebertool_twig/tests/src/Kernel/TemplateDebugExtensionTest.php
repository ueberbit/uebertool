<?php

declare(strict_types=1);

namespace Drupal\Tests\uebertool_twig\Kernel;

use Drupal\Core\DependencyInjection\ContainerBuilder;
use Drupal\KernelTests\KernelTestBase;
use PHPUnit\Framework\Attributes\Group;
use PHPUnit\Framework\Attributes\RunTestsInSeparateProcesses;

/**
 * Tests the theme debug comments around included and embedded templates.
 */
#[Group('uebertool_twig')]
#[RunTestsInSeparateProcesses]
final class TemplateDebugExtensionTest extends KernelTestBase {

  /**
   * {@inheritdoc}
   */
  protected static $modules = ['system', 'uebertool_companion', 'uebertool_twig'];

  /**
   * {@inheritdoc}
   */
  public function register(ContainerBuilder $container): void {
    parent::register($container);

    $config = $container->getParameter('twig.config');
    $config['debug'] = $this->name() !== 'testNoMarkersWithoutDebug';
    $container->setParameter('twig.config', $config);
  }

  /**
   * {@inheritdoc}
   */
  protected function setUp(): void {
    parent::setUp();

    $this->container->get('theme_installer')->install(['uebertool_test']);
    $this->config('system.theme')->set('default', 'uebertool_test')->save();
    $this->container->get('theme.manager')->setActiveTheme(
      $this->container->get('theme.initialization')->initTheme('uebertool_test'),
    );
  }

  /**
   * Renders an inline template.
   */
  protected function renderInline(string $template): string {
    $build = ['#type' => 'inline_template', '#template' => $template];
    return (string) $this->container->get('renderer')->renderInIsolation($build);
  }

  /**
   * The path the comments name for a template of the test theme.
   *
   * Twig resolves symlinks, so the path is only app root relative when the
   * companion is not symlinked into the site.
   */
  protected function templatePath(string $file): string {
    $path = realpath($this->root . '/' . $this->container->get('extension.list.theme')->getPath('uebertool_test') . '/templates/' . $file);
    return str_starts_with($path, $this->root . '/')
      ? substr($path, strlen($this->root) + 1)
      : $path;
  }

  /**
   * Tests that an include is wrapped in begin and end comments.
   */
  public function testInclude(): void {
    $path = $this->templatePath('plain.html.twig');
    $this->assertSame(
      "<!-- 📎 BEGIN OUTPUT from '$path' --><p>plain</p>\n<!-- END OUTPUT from '$path' -->",
      $this->renderInline("{% include '@uebertool_test/plain.html.twig' %}"),
    );
  }

  /**
   * Tests that an embed is marked with the template it embeds.
   */
  public function testEmbed(): void {
    $path = $this->templatePath('plain.html.twig');
    $this->assertSame(
      "<!-- 📎 BEGIN OUTPUT from '$path' --><p>plain</p>\n<!-- END OUTPUT from '$path' -->",
      $this->renderInline("{% embed '@uebertool_test/plain.html.twig' %}{% endembed %}"),
    );
  }

  /**
   * Tests the cases that get no comments of their own.
   */
  public function testUnmarked(): void {
    // Core already marks components.
    $output = $this->renderInline("{% include 'uebertool_test:card' %}");
    $this->assertStringContainsString('Component start: uebertool_test:card', $output);
    $this->assertStringNotContainsString('OUTPUT from', $output);

    $this->assertSame('', $this->renderInline("{% include '@uebertool_test/missing.html.twig' ignore missing %}"));
  }

  /**
   * Tests that templates compiled without debug stay unchanged.
   */
  public function testNoMarkersWithoutDebug(): void {
    $this->assertSame(
      "<p>plain</p>\n",
      $this->renderInline("{% include '@uebertool_test/plain.html.twig' %}"),
    );
  }

}
