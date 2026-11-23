<?php

declare(strict_types=1);

namespace Drupal\uebertool_docs_pages\EventSubscriber;

use Drupal\tome_static\Event\CollectPathsEvent;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;

/**
 * Limits the Tome static export to the docs.
 *
 * Tome collects every route and entity of the site. Only /uebertool is kept;
 * the docs pages and previews are found by crawling links and iframes from
 * there.
 */
final class StaticExportPathsSubscriber implements EventSubscriberInterface {

  /**
   * Drops every collected path outside the docs.
   */
  public function collectPaths(CollectPathsEvent $event): void {
    $event->replacePaths(array_filter(
      $event->getPaths(TRUE),
      static fn (string $path) => $path === '/uebertool' || str_starts_with($path, '/uebertool/'),
      ARRAY_FILTER_USE_KEY,
    ));
  }

  /**
   * {@inheritdoc}
   */
  public static function getSubscribedEvents(): array {
    // The event name as a string, so the module does not break without Tome.
    // Runs after Tome's own subscribers, including the exclude list (-2).
    return ['tome_static.collect_paths' => ['collectPaths', -10]];
  }

}
