<?php

declare(strict_types=1);

namespace Drupal\uebertool_docs_pages\Markdown;

use League\CommonMark\Node\Block\AbstractBlock;

/**
 * A generic directive: `::name[label]{attrs}` or `:::name[label]{attrs}`.
 *
 * Leaf directives (two colons) take a single line, container directives
 * (three colons) contain Markdown up to a closing `:::` line.
 */
final class Directive extends AbstractBlock {

  public function __construct(
    public readonly string $name,
    public readonly string $label,
    public readonly array $attributes,
    public readonly bool $container,
  ) {
    parent::__construct();
  }

  /**
   * Parses `key=value key="quoted value" flag` into an array.
   *
   * Flags without a value are TRUE.
   */
  public static function parseAttributes(string $input): array {
    preg_match_all('/([a-zA-Z][\w-]*)(?:=(?:"([^"]*)"|(\S+)))?/', $input, $matches, PREG_SET_ORDER | PREG_UNMATCHED_AS_NULL);
    $attributes = [];
    foreach ($matches as $match) {
      $attributes[$match[1]] = $match[2] ?? $match[3] ?? TRUE;
    }
    return $attributes;
  }

}
