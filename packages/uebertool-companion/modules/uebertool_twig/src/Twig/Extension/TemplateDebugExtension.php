<?php

declare(strict_types=1);

namespace Drupal\uebertool_twig\Twig\Extension;

use Drupal\uebertool_twig\Twig\NodeVisitor\TemplateDebugNodeVisitor;
use Twig\Environment;
use Twig\Error\LoaderError;
use Twig\Extension\AbstractExtension;

/**
 * Marks included and embedded templates in the theme debug output.
 *
 * Drupal only prints `BEGIN OUTPUT` / `END OUTPUT` comments around templates
 * rendered for a theme hook, so `{% include %}` and `{% embed %}` stay
 * invisible to anything reading the debug output, such as the template picker
 * of the Vite devtools. This adds the same comments around them.
 */
class TemplateDebugExtension extends AbstractExtension {

  /**
   * Matches an SDC id, whose output core already marks as a component.
   */
  protected const COMPONENT_ID = '/^[a-z]([a-zA-Z0-9_-]*[a-zA-Z0-9])*:[a-z]([a-zA-Z0-9_-]*[a-zA-Z0-9])*$/';

  public function __construct(
    protected string $appRoot,
  ) {}

  /**
   * {@inheritdoc}
   */
  public function getNodeVisitors(): array {
    return [new TemplateDebugNodeVisitor($this)];
  }

  /**
   * Builds the debug comment that opens or closes an included template.
   *
   * Only called from templates compiled in debug mode.
   *
   * @param \Twig\Environment $env
   *   The Twig environment.
   * @param mixed $name
   *   The template name, list of names or template, as passed to the tag.
   * @param bool $end
   *   Whether the comment closes the template.
   *
   * @return string
   *   The comment, or an empty string for a component, an inline template, a
   *   missing template or a file that is not Twig.
   */
  public function marker(Environment $env, mixed $name, bool $end): string {
    if (is_string($name) && preg_match(static::COMPONENT_ID, $name)) {
      return '';
    }

    try {
      $path = $env->resolveTemplate($name)->getSourceContext()->getPath();
    }
    catch (LoaderError) {
      return '';
    }

    if (!str_ends_with($path, '.twig')) {
      return '';
    }
    // App root relative like the theme engine's paths. Twig resolves symlinks,
    // so a symlinked extension keeps its absolute path, which still opens.
    if (str_starts_with($path, $this->appRoot . '/')) {
      $path = substr($path, strlen($this->appRoot) + 1);
    }

    // Same wording as the theme engine, so readers of the debug output need no
    // extra rule. The badge tells includes apart from theme hook templates.
    return $end
      ? sprintf("<!-- END OUTPUT from '%s' -->", $path)
      : sprintf("<!-- 📎 BEGIN OUTPUT from '%s' -->", $path);
  }

}
