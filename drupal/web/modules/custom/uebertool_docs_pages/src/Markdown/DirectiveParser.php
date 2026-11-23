<?php

declare(strict_types=1);

namespace Drupal\uebertool_docs_pages\Markdown;

use League\CommonMark\Node\Block\AbstractBlock;
use League\CommonMark\Parser\Block\AbstractBlockContinueParser;
use League\CommonMark\Parser\Block\BlockContinue;
use League\CommonMark\Parser\Block\BlockContinueParserInterface;
use League\CommonMark\Parser\Block\BlockStart;
use League\CommonMark\Parser\Block\BlockStartParserInterface;
use League\CommonMark\Parser\Cursor;
use League\CommonMark\Parser\MarkdownParserStateInterface;

/**
 * Parses `::name[label]{attrs}` and `:::name[label]{attrs}` … `:::` blocks.
 *
 * A closing `:::` ends the innermost open container, even inside a fenced code
 * block, so code in a container must not contain such a line.
 */
final class DirectiveParser extends AbstractBlockContinueParser implements BlockStartParserInterface {

  private const START = '/^(:{2,3})([a-z][a-z0-9-]*)(?:\[([^\]]*)\])?(?:\{([^}]*)\})?\s*$/';

  public function __construct(
    private readonly ?Directive $block = NULL,
  ) {}

  /**
   * {@inheritdoc}
   */
  public function tryStart(Cursor $cursor, MarkdownParserStateInterface $parserState): ?BlockStart {
    if ($cursor->isIndented() || $cursor->getNextNonSpaceCharacter() !== ':') {
      return BlockStart::none();
    }
    if (!preg_match(self::START, trim($cursor->getRemainder()), $match)) {
      return BlockStart::none();
    }
    $cursor->advanceToEnd();

    $directive = new Directive($match[2], $match[3] ?? '', Directive::parseAttributes($match[4] ?? ''), $match[1] === ':::');
    return BlockStart::of(new self($directive))->at($cursor);
  }

  /**
   * {@inheritdoc}
   */
  public function getBlock(): AbstractBlock {
    return $this->block;
  }

  /**
   * {@inheritdoc}
   */
  public function isContainer(): bool {
    return $this->block->container;
  }

  /**
   * {@inheritdoc}
   */
  public function canContain(AbstractBlock $childBlock): bool {
    return $this->block->container;
  }

  /**
   * {@inheritdoc}
   */
  public function tryContinue(Cursor $cursor, BlockContinueParserInterface $activeBlockParser): ?BlockContinue {
    if (!$this->block->container) {
      return BlockContinue::none();
    }
    if (!$cursor->isIndented() && trim($cursor->getRemainder()) === ':::') {
      $cursor->advanceToEnd();
      return BlockContinue::finished();
    }
    return BlockContinue::at($cursor);
  }

}
