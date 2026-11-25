<?php

declare(strict_types=1);

namespace Drupal\uebertool_docs_pages\Markdown;

use Drupal\Core\Extension\ThemeExtensionList;
use Drupal\Core\Language\LanguageManagerInterface;
use Drupal\Core\Render\Markup;
use Drupal\Core\Url;
use League\CommonMark\Environment\Environment;
use League\CommonMark\Event\DocumentParsedEvent;
use League\CommonMark\Extension\CommonMark\CommonMarkCoreExtension;
use League\CommonMark\Extension\CommonMark\Node\Block\FencedCode;
use League\CommonMark\Extension\CommonMark\Node\Inline\Link;
use League\CommonMark\Extension\FrontMatter\Data\SymfonyYamlFrontMatterParser;
use League\CommonMark\Extension\FrontMatter\FrontMatterExtension;
use League\CommonMark\Extension\FrontMatter\FrontMatterParser;
use League\CommonMark\Extension\GithubFlavoredMarkdownExtension;
use League\CommonMark\Node\Node;
use League\CommonMark\Parser\MarkdownParser;
use League\CommonMark\Renderer\HtmlRenderer;

/**
 * Renders the Markdown pages from the docs/ folder of the uebertool_docs theme.
 *
 * Plain Markdown becomes markup, code blocks and directives become render
 * elements of the theme's components, so their libraries are attached like
 * in any other template. See README.md for the syntax.
 */
final class DocsMarkdown {

  private const ASIDES = ['note', 'tip', 'caution', 'danger'];

  private const COMPONENTS = '@uebertool_docs/components/';

  private ?MarkdownParser $parser = NULL;

  private ?HtmlRenderer $renderer = NULL;

  public function __construct(
    private readonly ThemeExtensionList $themes,
    private readonly LanguageManagerInterface $languageManager,
  ) {}

  /**
   * Returns the front matter of a Markdown file, e.g. title and description.
   */
  public function frontMatter(string $file): array {
    return (array) (new FrontMatterParser(new SymfonyYamlFrontMatterParser()))
      ->parse((string) file_get_contents($file))
      ->getFrontMatter();
  }

  /**
   * Returns the render array of a Markdown file.
   */
  public function build(string $file): array {
    $this->parser ??= $this->createParser();
    return $this->buildChildren($this->parser->parse((string) file_get_contents($file)));
  }

  /**
   * Builds the children of a node, merging consecutive markup.
   */
  private function buildChildren(Node $parent): array {
    $build = [];
    $html = '';
    foreach ($parent->children() as $child) {
      $component = $this->buildComponent($child);
      if ($component === NULL) {
        $html .= $this->renderer->renderNodes([$child]) . "\n";
        continue;
      }
      if ($html !== '') {
        $build[] = ['#markup' => Markup::create($html)];
        $html = '';
      }
      $build[] = $component;
    }
    if ($html !== '') {
      $build[] = ['#markup' => Markup::create($html)];
    }
    return $build;
  }

  /**
   * Returns the render element of a component node, or NULL for markup.
   */
  private function buildComponent(Node $node): ?array {
    if ($node instanceof FencedCode) {
      return $this->buildCode($node);
    }
    if (!$node instanceof Directive) {
      return NULL;
    }
    if ($node->name === 'preview' && !$node->container) {
      $demo = $node->attributes['demo'] ?? throw new \InvalidArgumentException('::preview needs a demo attribute.');
      // lang renders the preview in another interface language.
      $options = isset($node->attributes['lang'])
        ? ['language' => $this->languageManager->getLanguage($node->attributes['lang']) ?? throw new \InvalidArgumentException(sprintf('::preview: unknown language %s.', $node->attributes['lang']))]
        : [];
      return $this->component('preview/preview.html.twig', [
        'demo' => $demo,
        'src' => Url::fromRoute('uebertool_docs_pages.preview', ['demo' => $demo], $options)->toString(),
        'title' => $node->attributes['title'] ?? '',
        'iframe' => (bool) ($node->attributes['iframe'] ?? FALSE),
        'height' => $node->attributes['height'] ?? NULL,
      ]);
    }
    if (in_array($node->name, self::ASIDES, TRUE) && $node->container) {
      return [
        '#type' => 'inline_template',
        '#template' => "{% embed '" . self::COMPONENTS . "aside/aside.html.twig' with { type: type, title: title, content: content } only %}{% block content %}{{ content }}{% endblock %}{% endembed %}",
        '#context' => [
          'type' => $node->name,
          'title' => $node->label ?: NULL,
          'content' => $this->buildChildren($node),
        ],
      ];
    }
    throw new \InvalidArgumentException(sprintf('Unknown directive %s%s.', $node->container ? ':::' : '::', $node->name));
  }

  /**
   * Builds a code block, optionally with the code of a file of the theme.
   *
   * Info string: `lang file=path/in/theme title="Title"`.
   */
  private function buildCode(FencedCode $node): array {
    $info = trim((string) $node->getInfo());
    [$lang, $attributes] = array_pad(preg_split('/\s+/', $info, 2), 2, '');
    $attributes = Directive::parseAttributes($attributes);
    $code = $node->getLiteral();

    if (isset($attributes['file'])) {
      $file = $attributes['file'];
      $code = $this->readThemeFile($file) ?? "# $file has not been generated yet. Run `pnpm build`.";
    }

    return $this->component('code-block/code-block.html.twig', [
      'lang' => $lang ?: NULL,
      'title' => $attributes['title'] ?? $attributes['file'] ?? NULL,
      'code' => trim($code),
    ]);
  }

  /**
   * Returns a render element that includes a component of the theme.
   */
  private function component(string $template, array $context): array {
    return [
      '#type' => 'inline_template',
      '#template' => "{% include '" . self::COMPONENTS . $template . "' with vars only %}",
      '#context' => ['vars' => $context],
    ];
  }

  /**
   * Reads a file of the theme, refusing paths outside of it.
   */
  private function readThemeFile(string $file): ?string {
    $root = realpath($this->themes->getPath('uebertool_docs'));
    $path = realpath("$root/$file");
    if ($path === FALSE || !str_starts_with($path, "$root/") || !is_file($path)) {
      return NULL;
    }
    return (string) file_get_contents($path);
  }

  /**
   * Creates the parser and the renderer for markup.
   */
  private function createParser(): MarkdownParser {
    $environment = new Environment([
      // The docs are part of the codebase, so raw HTML is allowed.
      'html_input' => 'allow',
      'allow_unsafe_links' => FALSE,
    ]);
    $environment->addExtension(new CommonMarkCoreExtension());
    $environment->addExtension(new GithubFlavoredMarkdownExtension());
    $environment->addExtension(new FrontMatterExtension());
    $environment->addBlockStartParser(new DirectiveParser(), 100);
    $environment->addEventListener(DocumentParsedEvent::class, $this->rewriteLinks(...));

    $this->renderer = new HtmlRenderer($environment);
    return new MarkdownParser($environment);
  }

  /**
   * Turns relative links to other pages into their URLs.
   *
   * `../02-build/01-entrypoints.md#fragment` becomes the URL of the page
   * entrypoints. The relative links also work when browsing the docs on GitHub.
   */
  private function rewriteLinks(DocumentParsedEvent $event): void {
    foreach ($event->getDocument()->iterator() as $node) {
      if ($node instanceof Link && preg_match('#^(?:[\w./-]*/)?\d+-([a-z0-9-]+)\.md(?:\#(.+))?$#', $node->getUrl(), $match)) {
        $options = isset($match[2]) ? ['fragment' => $match[2]] : [];
        $node->setUrl(Url::fromRoute('uebertool_docs_pages.page', ['slug' => $match[1]], $options)->toString());
      }
    }
  }

}
