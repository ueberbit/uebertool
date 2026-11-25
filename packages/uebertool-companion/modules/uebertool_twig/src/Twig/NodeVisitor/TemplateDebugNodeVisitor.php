<?php

declare(strict_types=1);

namespace Drupal\uebertool_twig\Twig\NodeVisitor;

use Drupal\uebertool_twig\Twig\Extension\TemplateDebugExtension;
use Twig\Environment;
use Twig\Node\EmbedNode;
use Twig\Node\Expression\ConstantExpression;
use Twig\Node\Expression\FunctionExpression;
use Twig\Node\IncludeNode;
use Twig\Node\ModuleNode;
use Twig\Node\Node;
use Twig\Node\Nodes;
use Twig\Node\PrintNode;
use Twig\NodeVisitor\NodeVisitorInterface;
use Twig\TwigFunction;

/**
 * Wraps `{% include %}` and `{% embed %}` in theme debug comments.
 *
 * Only applies in debug mode. Twig keys its compiled templates by the
 * environment options, so production templates stay untouched.
 */
final class TemplateDebugNodeVisitor implements NodeVisitorInterface {

  /**
   * The template each embed extends, keyed by `template name:embed index`.
   *
   * @var array<string, \Twig\Node\Node>
   */
  private array $embedParents = [];

  public function __construct(
    private readonly TemplateDebugExtension $extension,
  ) {}

  /**
   * {@inheritdoc}
   */
  public function enterNode(Node $node, Environment $env): Node {
    // An embed node only knows the index of its anonymous template, so look up
    // the template that one extends before the body is visited.
    if ($node instanceof ModuleNode && $env->isDebug()) {
      foreach ($node->getAttribute('embedded_templates') as $embedded) {
        if ($embedded->hasNode('parent')) {
          $this->embedParents[$this->embedKey($embedded->getTemplateName(), $embedded->getAttribute('index'))] = $embedded->getNode('parent');
        }
      }
    }
    return $node;
  }

  /**
   * {@inheritdoc}
   */
  public function leaveNode(Node $node, Environment $env): ?Node {
    if (!$env->isDebug()) {
      return $node;
    }

    if ($node instanceof ModuleNode) {
      foreach ($node->getAttribute('embedded_templates') as $embedded) {
        unset($this->embedParents[$this->embedKey($embedded->getTemplateName(), $embedded->getAttribute('index'))]);
      }
      return $node;
    }

    if (!$node instanceof IncludeNode) {
      return $node;
    }

    $name = $node instanceof EmbedNode
      ? $this->embedParents[$this->embedKey($node->getAttribute('name'), $node->getAttribute('index'))] ?? NULL
      : $node->getNode('expr');
    if (!$name) {
      return $node;
    }

    $line = $node->getTemplateLine();
    return new Nodes([
      $this->marker($name, FALSE, $line),
      $node,
      $this->marker($name, TRUE, $line),
    ], $line);
  }

  /**
   * Builds the node printing an opening or closing comment.
   */
  private function marker(Node $name, bool $end, int $line): PrintNode {
    return new PrintNode(new FunctionExpression(
      new TwigFunction('uebertool_template_marker', [$this->extension, 'marker'], [
        'needs_environment' => TRUE,
        'is_safe' => ['html'],
      ]),
      new Nodes([clone $name, new ConstantExpression($end, $line)]),
      $line,
    ), $line);
  }

  /**
   * Identifies an embedded template.
   */
  private function embedKey(string $name, ?int $index): string {
    return $name . ':' . $index;
  }

  /**
   * {@inheritdoc}
   */
  public function getPriority(): int {
    // After the escaper, like core's ComponentNodeVisitor, so the comments are
    // printed raw.
    return 250;
  }

}
