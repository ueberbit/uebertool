<?php

declare(strict_types=1);

namespace Drupal\uebertool_docs_pages\Theme;

use Drupal\Core\Routing\RouteMatchInterface;
use Drupal\Core\Theme\ThemeNegotiatorInterface;

/**
 * Uses the uebertool_docs theme on all docs routes.
 */
final class DocsThemeNegotiator implements ThemeNegotiatorInterface {

  /**
   * {@inheritdoc}
   */
  public function applies(RouteMatchInterface $route_match): bool {
    return str_starts_with((string) $route_match->getRouteName(), 'uebertool_docs_pages.');
  }

  /**
   * {@inheritdoc}
   */
  public function determineActiveTheme(RouteMatchInterface $route_match): string {
    return 'uebertool_docs';
  }

}
