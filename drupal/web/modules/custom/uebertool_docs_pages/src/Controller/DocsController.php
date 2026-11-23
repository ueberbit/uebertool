<?php

declare(strict_types=1);

namespace Drupal\uebertool_docs_pages\Controller;

use Drupal\Core\Controller\ControllerBase;
use Drupal\Core\Url;
use Drupal\uebertool_docs_pages\DocsNavigation;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

/**
 * Renders the docs pages and the bare preview pages used in iframes.
 */
final class DocsController extends ControllerBase {

  public function __construct(
    private readonly DocsNavigation $navigation,
  ) {}

  /**
   * Redirects /uebertool to the first page.
   */
  public function index(): RedirectResponse {
    $slug = array_key_first($this->navigation->pages());
    return new RedirectResponse(Url::fromRoute('uebertool_docs_pages.page', ['slug' => $slug])->toString());
  }

  /**
   * Renders a docs page.
   */
  public function page(string $slug): array {
    $page = $this->navigation->page($slug) ?? throw new NotFoundHttpException();

    return [
      '#theme' => 'uebertool_docs_page',
      '#slug' => $slug,
      '#description' => $page['description'] ?? '',
    ];
  }

  /**
   * Title callback for docs pages.
   */
  public function title(string $slug): string {
    return $this->navigation->page($slug)['title'] ?? '';
  }

  /**
   * Renders a single demo without the docs layout.
   */
  public function preview(string $demo): array {
    return [
      '#theme' => 'uebertool_docs_preview',
      '#demo' => $demo,
    ];
  }

}
