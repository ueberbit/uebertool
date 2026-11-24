<?php

declare(strict_types=1);

namespace Drupal\Tests\uebertool_twig_loader\Kernel;

use Drupal\Core\Routing\RouteObjectInterface;
use Drupal\KernelTests\KernelTestBase;
use PHPUnit\Framework\Attributes\Group;
use PHPUnit\Framework\Attributes\RunTestsInSeparateProcesses;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Session\Session;
use Symfony\Component\HttpFoundation\Session\Storage\MockArraySessionStorage;
use Symfony\Component\Routing\Route;

/**
 * Tests the automatic library attachment of the UEbertool Twig loaders.
 */
#[Group('uebertool_twig_loader')]
#[RunTestsInSeparateProcesses]
final class TwigLoaderTest extends KernelTestBase {

  /**
   * {@inheritdoc}
   */
  protected static $modules = ['system', 'uebertool_companion', 'uebertool_twig_loader'];

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
   * Renders a render array and returns the attached libraries.
   */
  protected function renderLibraries(array $build): array {
    $this->container->get('renderer')->renderInIsolation($build);
    return $build['#attached']['library'] ?? [];
  }

  /**
   * Tests that a template gets the library of the same name attached.
   */
  public function testTemplateLibraryIsAttached(): void {
    $loader = $this->container->get('uebertool_twig_loader.twig.loader.filesystem');

    $this->assertStringStartsWith(
      "{{ attach_library('uebertool_test_dist/card') }}",
      $loader->getSourceContext('@uebertool_test/card.html.twig')->getCode(),
    );
    $this->assertSame(
      "<p>plain</p>\n",
      $loader->getSourceContext('@uebertool_test/plain.html.twig')->getCode(),
    );

    $libraries = $this->renderLibraries([
      '#type' => 'inline_template',
      '#template' => "{% include '@uebertool_test/card.html.twig' %}",
    ]);
    $this->assertContains('uebertool_test_dist/card', $libraries);
  }

  /**
   * Tests that compiled templates are not shared with core's loader.
   */
  public function testCacheKeyDiffersFromCore(): void {
    $name = '@uebertool_test/card.html.twig';
    $key = $this->container->get('uebertool_twig_loader.twig.loader.filesystem')->getCacheKey($name);

    $this->assertNotSame($this->container->get('twig.loader.filesystem')->getCacheKey($name), $key);
    $this->assertStringStartsWith('uebertool:uebertool_test:', $key);
  }

  /**
   * Tests that the loader steps aside on admin routes.
   */
  public function testAdminRouteIsSkipped(): void {
    $request = Request::create('/admin');
    $request->setSession(new Session(new MockArraySessionStorage()));
    $request->attributes->set(RouteObjectInterface::ROUTE_OBJECT, new Route('/admin', [], [], ['_admin_route' => TRUE]));
    $request->attributes->set(RouteObjectInterface::ROUTE_NAME, 'uebertool_test.admin');
    $this->container->get('request_stack')->push($request);

    $loader = $this->container->get('uebertool_twig_loader.twig.loader.filesystem');
    $this->assertFalse($loader->exists('@uebertool_test/card.html.twig'));
  }

  /**
   * Tests that a single directory component gets its dist library attached.
   */
  public function testComponentLibraryIsAttached(): void {
    $libraries = $this->renderLibraries([
      '#type' => 'component',
      '#component' => 'uebertool_test:card',
    ]);
    $this->assertContains('uebertool_test_dist/sdc--card', $libraries);
  }

}
