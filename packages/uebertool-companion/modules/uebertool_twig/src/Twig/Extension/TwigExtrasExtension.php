<?php

declare(strict_types=1);

namespace Drupal\uebertool_twig\Twig\Extension;

use Drupal\Component\Utility\Html;
use Drupal\Component\Uuid\UuidInterface;
use Drupal\Core\Field\FieldItemListInterface;
use Drupal\Core\Language\LanguageInterface;
use Drupal\Core\Language\LanguageManagerInterface;
use Drupal\Core\Render\BubbleableMetadata;
use Drupal\Core\Render\Element;
use Drupal\Core\Render\RendererInterface;
use Drupal\Core\StringTranslation\ByteSizeMarkup;
use Drupal\Core\StringTranslation\TranslatableMarkup;
use Drupal\Core\Template\Attribute;
use Drupal\Core\Url;
use Drupal\file\FileInterface;
use Twig\Extension\AbstractExtension;
use Twig\TwigFilter;
use Twig\TwigFunction;

/**
 * Provides field value filters and helper functions for Twig templates.
 */
class TwigExtrasExtension extends AbstractExtension {

  public function __construct(
    protected RendererInterface $renderer,
    protected UuidInterface $uuid,
    protected LanguageManagerInterface $languageManager,
  ) {}

  /**
   * {@inheritdoc}
   */
  public function getFilters(): array {
    return [
      new TwigFilter('field_empty', [$this, 'fieldEmptyFilter']),
      new TwigFilter('field_isset', [$this, 'fieldIssetFilter']),
      new TwigFilter('file_size', [$this, 'fileSize']),
      new TwigFilter('file_mime', [$this, 'mimeType']),
      new TwigFilter('link_url', [$this, 'linkUrl']),
      new TwigFilter('link_text', [$this, 'linkText']),
      new TwigFilter('link_attrs', [$this, 'linkAttributes']),
    ];
  }

  /**
   * {@inheritdoc}
   */
  public function getFunctions(): array {
    return [
      new TwigFunction('button', [$this, 'getButton']),
      new TwigFunction('buttons', [$this, 'getButtons']),
      new TwigFunction('languages', [$this, 'getLanguages']),
      new TwigFunction('URL', [$this, 'urlFromUserInput']),
      new TwigFunction('HTML', [$this, 'html']),
      new TwigFunction('class', [$this, 'classList']),
      new TwigFunction('uuid', [$this, 'uuid']),
    ];
  }

  /**
   * Checks whether the render array is a field's render array.
   */
  protected function isFieldRenderArray(?array $build): bool {
    return isset($build['#theme']) && $build['#theme'] === 'field';
  }

  /**
   * Checks if a field render array is missing or has no items.
   */
  protected function checkForEmpty(?array $build): bool {
    if (!$this->isFieldRenderArray($build)) {
      return TRUE;
    }

    return empty(Element::children($build));
  }

  /**
   * Checks if a field is empty.
   */
  public function fieldEmptyFilter(?array $build): bool {
    return $this->checkForEmpty($build);
  }

  /**
   * Checks if a field is set and has items.
   */
  public function fieldIssetFilter(?array $build): bool {
    return !$this->checkForEmpty($build);
  }

  /**
   * Gets the first file of a file or image field render array.
   */
  protected function firstFile(?array $build): ?FileInterface {
    if (!in_array($build['#field_type'] ?? NULL, ['file', 'image'], TRUE)) {
      return NULL;
    }

    $items = $build['#items'] ?? NULL;
    if (!$items instanceof FieldItemListInterface) {
      return NULL;
    }

    $file = $items->first()?->entity;
    return $file instanceof FileInterface ? $file : NULL;
  }

  /**
   * Gets the human readable size of the first file in a file field.
   */
  public function fileSize(?array $build): TranslatableMarkup|string {
    $file = $this->firstFile($build);
    if (!$file) {
      return '';
    }

    return ByteSizeMarkup::create((int) $file->getSize());
  }

  /**
   * Gets the short mime type (e.g. "PDF") of the first file in a file field.
   */
  public function mimeType(?array $build): string {
    $mime = $this->firstFile($build)?->getMimeType();
    if (!$mime) {
      return '';
    }

    $parts = explode('/', $mime);
    $short = end($parts);
    if (str_contains($short, 'word')) {
      return 'WORD';
    }
    return strtoupper($short);
  }

  /**
   * Bubbles cacheability and attachments to the current render context.
   */
  protected function bubble(BubbleableMetadata $metadata): void {
    if (!$this->renderer->hasRenderContext()) {
      return;
    }

    $build = [];
    $metadata->applyTo($build);
    $this->renderer->render($build);
  }

  /**
   * Retrieves the link url from a link render array or link field item.
   */
  public function linkUrl(?array $build): string {
    if ($this->isLink($build)) {
      $generatedUrl = $build['#url']->toString(TRUE);
      $this->bubble($generatedUrl);
      return $generatedUrl->getGeneratedUrl();
    }

    // BC-Layer, handle array link fields items.
    if (isset($build[0]) && $this->isLink($build[0])) {
      @trigger_error('Calling link_url on a field render array is deprecated in uebertool_companion:0.6.0 and is removed from uebertool_companion:1.0.0. Use |field_value|first|link_url instead. See https://github.com/ueberbit/uebertool/tree/main/packages/uebertool-companion/modules/uebertool_twig#deprecations', E_USER_DEPRECATED);
      return $this->linkUrl($build[0]);
    }

    return '';
  }

  /**
   * Retrieves the link text from a link render array or link field item.
   */
  public function linkText(?array $build): string {
    if ($this->isLink($build)) {
      return (string) ($build['#title'] ?? '');
    }

    // BC-Layer, handle array link fields items.
    if (isset($build[0]) && $this->isLink($build[0])) {
      @trigger_error('Calling link_text on a field render array is deprecated in uebertool_companion:0.6.0 and is removed from uebertool_companion:1.0.0. Use |field_value|first|link_text instead. See https://github.com/ueberbit/uebertool/tree/main/packages/uebertool-companion/modules/uebertool_twig#deprecations', E_USER_DEPRECATED);
      return $this->linkText($build[0]);
    }

    return '';
  }

  /**
   * Retrieves the link attributes from a link render array or link field item.
   */
  public function linkAttributes(?array $build): Attribute {
    if ($this->isLink($build)) {
      $linkAttributes = new Attribute();
      $linkAttributes->addClass($build['#url']->getOption('attributes')['class'] ?? []);
      if ((string) $linkAttributes) {
        @trigger_error('Handling the class attribute from the Url object in link_attrs is deprecated in uebertool_companion:0.7.5 and is removed from uebertool_companion:1.0.0. Use $element["#attributes"] instead. See https://www.drupal.org/node/3494015', E_USER_DEPRECATED);
      }

      // Render the link the way core does, so attributes added by core (e.g.
      // for <button> and <nolink>) are included.
      $markup = (string) $this->renderer->renderInIsolation($build);
      $this->bubble(BubbleableMetadata::createFromRenderArray($build));

      $xpath = new \DOMXPath(Html::load($markup));
      $element = $xpath->query('//a | //span | //button')->item(0);
      $attribute = new Attribute();
      if ($element instanceof \DOMElement && $element->hasAttributes()) {
        $values = [];
        foreach ($element->attributes as $name => $node) {
          $values[$name] = $node->nodeValue;
        }
        $attribute = new Attribute($values);
        $attribute->removeAttribute('href');
      }
      $attribute->merge($linkAttributes);
      return $attribute;
    }

    // BC-Layer, handle array link fields items.
    if (isset($build[0]) && $this->isLink($build[0])) {
      @trigger_error('Calling link_attrs on a field render array is deprecated in uebertool_companion:0.6.0 and is removed from uebertool_companion:1.0.0. Use |field_value|first|link_attrs instead. See https://github.com/ueberbit/uebertool/tree/main/packages/uebertool-companion/modules/uebertool_twig#deprecations', E_USER_DEPRECATED);
      return $this->linkAttributes($build[0]);
    }

    return new Attribute();
  }

  /**
   * Adds the button classes to a link render array.
   */
  protected function addButtonClasses(array $link, string $variant): array {
    $link['#attributes']['class'] = array_values(array_filter([
      ...(array) ($link['#attributes']['class'] ?? []),
      'button',
      $variant !== '' ? 'button--' . $variant : NULL,
    ]));
    return $link;
  }

  /**
   * Gets a single button from a link element or the first link of a field.
   *
   * @param array|null $build
   *   A link render array or a link field render array.
   * @param string|null $variant
   *   The button variant (primary, secondary, etc.).
   *
   * @return array|null
   *   The link render array with button classes, or NULL if there is no link.
   */
  public function getButton(?array $build, ?string $variant = ''): ?array {
    if ($this->isLink($build)) {
      return $this->addButtonClasses($build, (string) $variant);
    }

    if (isset($build[0]) && $this->isLink($build[0])) {
      return $this->addButtonClasses($build[0], (string) $variant);
    }

    return NULL;
  }

  /**
   * Adds button classes to every link of a link field.
   *
   * @param array|null $build
   *   A link field render array, or a single link render array.
   * @param string|array $variant
   *   One variant for all links, or a list of variants keyed by item delta.
   *
   * @return array|null
   *   The render array with button classes added to its links.
   */
  public function getButtons(?array $build, string|array|null $variant = ''): ?array {
    $variant ??= '';
    if ($this->isLink($build)) {
      return $this->addButtonClasses($build, is_string($variant) ? $variant : (string) ($variant[0] ?? ''));
    }

    if ($build === NULL) {
      return NULL;
    }

    foreach (Element::children($build) as $key) {
      if (!$this->isLink($build[$key])) {
        continue;
      }
      $currentVariant = is_string($variant) ? $variant : (string) ($variant[$key] ?? '');
      $build[$key] = $this->addButtonClasses($build[$key], $currentVariant);
    }

    return $build;
  }

  /**
   * Checks if a render array is a link element.
   */
  protected function isLink(?array $build): bool {
    return ($build['#type'] ?? NULL) === 'link'
      && ($build['#url'] ?? NULL) instanceof Url;
  }

  /**
   * Formats a language for templates.
   */
  protected function languageInfo(LanguageInterface $language, string $currentLanguage): array {
    return [
      'name' => $language->getName(),
      'id' => $language->getId(),
      'direction' => $language->getDirection(),
      'locked' => $language->isLocked(),
      'active' => $language->getId() === $currentLanguage,
    ];
  }

  /**
   * Gets all languages or a single language.
   *
   * @param string|null $language
   *   A langcode. Unknown langcodes return the current language.
   *
   * @return array
   *   A single language, or all languages with the active one first.
   */
  public function getLanguages(?string $language = NULL): array {
    $languages = $this->languageManager->getLanguages();
    $currentLanguage = $this->languageManager->getCurrentLanguage()->getId();

    if ($language) {
      $key = isset($languages[$language]) ? $language : $currentLanguage;
      return $this->languageInfo($languages[$key], $currentLanguage);
    }

    $langs = array_map(fn(LanguageInterface $lang) => $this->languageInfo($lang, $currentLanguage), $languages);

    // Return active language first.
    uasort($langs, fn(array $a, array $b) => $b['active'] <=> $a['active']);

    return $langs;
  }

  /**
   * Returns a Drupal Url object from user input.
   */
  public function urlFromUserInput(string $url, array $options = []): Url {
    return Url::fromUserInput($url, $options);
  }

  /**
   * Renders HTML from a string. Only use this for demo purposes.
   *
   * The markup is filtered by Xss::filterAdmin().
   */
  public function html(string|\Stringable|null $html): array {
    return [
      '#markup' => (string) $html,
    ];
  }

  /**
   * Shortcut for create_attribute().addClass().
   */
  public function classList(string|array $classes): Attribute {
    $attribute = new Attribute();
    $attribute->addClass($classes);
    return $attribute;
  }

  /**
   * Generates a Universally Unique IDentifier (UUID).
   */
  public function uuid(): string {
    return $this->uuid->generate();
  }

}
