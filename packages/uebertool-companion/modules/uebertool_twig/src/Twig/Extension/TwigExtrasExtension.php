<?php

namespace Drupal\uebertool_twig\Twig\Extension;

use Drupal\Core\Render\Element;
use Drupal\Core\StringTranslation\TranslatableMarkup;
use Drupal\Core\Template\Attribute;
use Drupal\Core\URL;
use Twig\Extension\AbstractExtension;
use Twig\TwigFilter;
use Twig\TwigFunction;

/**
 * Provides field value filters for Twig templates.
 */
class TwigExtrasExtension extends AbstractExtension {

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
  public function getFunctions() {
    return [
      new TwigFunction('button', [$this, 'getButton']),
      new TwigFunction('buttons', [$this, 'getButtons']),
      new TwigFunction('buttons', [$this, 'getButtons']),
      new TwigFunction('languages', [$this, 'getLanguages']),
      new TwigFunction('URL', [$this, 'urlFromUserInput']),
    ];
  }

  /**
   * Checks whether the render array is a field's render array.
   *
   * @param array|null $build
   *   The render array.
   *
   * @return bool
   *   True if $build is a field render array.
   */
  protected function isFieldRenderArray($build) {
    return isset($build['#theme']) && $build['#theme'] == 'field';
  }

  /**
   * Checks if a field is empty.
   *
   * @param array $build
   *   The render array whose children are to be filtered.
   *
   * @return bool
   *   Empty or not.
   */
  protected function checkForEmpty($build): bool {
    if (!isset($build)) {
      return TRUE;
    }

    if (!$this->isFieldRenderArray($build)) {
      return TRUE;
    }

    $elements = Element::children($build);
    if (empty($elements)) {
      return TRUE;
    }

    return FALSE;
  }

  /**
   * Checks if a field is empty.
   *
   * @param array $build
   *   The render array whose children are to be filtered.
   *
   * @return bool
   *   Empty or not.
   */
  public function fieldEmptyFilter(?array $build): bool {
    return $this->checkForEmpty($build);
  }

  /**
   * Checks if a field isset.
   *
   * @param array $build
   *   The render array whose children are to be filtered.
   *
   * @return bool
   *   Empty or not.
   */
  public function fieldIssetFilter(?array $build): bool {
    return !$this->checkForEmpty($build);
  }

  /**
   * Get File Size from a file field.
   *
   * @param array $build
   *   The render array whose children are to be filtered.
   *
   * @return \Drupal\Core\StringTranslation\TranslatableMarkup|null
   *   Human Readable filesize.
   */
  public function fileSize(?array $build): TranslatableMarkup | string {
    if (isset($build['#field_type']) && $build['#field_type'] !== 'file') {
      return '';
    }

    $files = $build['#items']->referencedEntities();
    if (empty($files)) {
      return '';
    }

    $fileSize = format_size($files[0]->getSize());
    return $fileSize;
  }

  /**
   * Get Mimetype from a file field.
   *
   * @param array $build
   *   The render array whose children are to be filtered.
   *
   * @return string
   *   Mime Type.
   */
  public function mimeType(?array $build): string {
    if (isset($build['#field_type']) && $build['#field_type'] !== 'file') {
      return '';
    }

    $files = $build['#items']->referencedEntities();

    if (empty($files)) {
      return '';
    }

    $mime_full = $files[0]->getMimeType();
    $mime_short = explode('/', $mime_full);
    $mime_short = end($mime_short);
    if (str_contains($mime_short, 'word')) {
      return 'WORD';
    }
    return strtoupper($mime_short);
  }

  /**
   * Get url of a Link Field.
   *
   * @param array $build
   *   The render array whose children are to be filtered.
   *
   * @return string
   *   Link url.
   */
  public function linkUrl(?array $build): string {
    if (!$this->isLink($build)) {
      return '';
    }

    /** @var \Drupal\Core\URL */
    $url = $build[0]['#url'];

    return $url->toString();
  }

  /**
   * Get text of a Link Field.
   *
   * @param array $build
   *   The render array whose children are to be filtered.
   *
   * @return string
   *   Link Text.
   */
  public function linkText(?array $build): string {
    if (!$this->isLink($build)) {
      return '';
    }

    if (!isset($build[0]['#title'])) {
      return '';
    }

    return $build[0]['#title'];
  }

  /**
   * Get Attributes of a Link Field.
   *
   * @param array $build
   *   The render array whose children are to be filtered.
   *
   * @return Drupal\Core\Template\Attribute;
   *   Attributes.
   */
  public function linkAttributes(?array $build): Attribute {
    if (!$this->isLink($build)) {
      return new Attribute([]);
    }

    /** @var \Drupal\Core\URL */
    $url = $build[0]['#url'];
    $options = $url->getOptions();

    if (empty($options) || !isset($options['attributes'])) {
      return new Attribute([]);
    }

    return new Attribute($options['attributes']);
  }

  /**
   * Gets a rendered button from a link field.
   *
   * @param array $build
   *   The link text for the anchor tag as a translated string.
   * @param string $variant
   *   The Button variant (primary, secondary, etc.).
   *
   * @return array
   *   A render array representing a button to the given URL.
   */
  public function getButton(?array $build, $variant = '') {
    if (!$this->isLink($build)) {
      return $build[0];
    }

    return $this->getButtons($build, [$variant])[0];
  }

  /**
   * Gets rendered buttons from a link field.
   *
   * @param array $build
   *   The link text for the anchor tag as a translated string.
   * @param string|array $variant
   *   The Button variant (primary, secondary, etc.).
   *
   * @return array
   *   A render array representing a button to the given URL.
   */
  public function getButtons(?array $build, $variant = '') {
    if (!$this->isLink($build)) {
      return $build[0];
    }

    foreach (Element::children($build) as $key) {
      /** @var \Drupal\Core\URL */
      $url = $build[$key]['#url'];
      $currentVariant = is_string($variant) ? $variant : $variant[$key];

      $url->mergeOptions([
        'attributes' => [
          'class' => [
            'button',
            !$currentVariant ?: 'button--' . $currentVariant,
          ],
        ],
      ]);
    }

    return $build;
  }

  /**
   * Check if field is a link.
   *
   * @param array|null $build
   *
   * @return bool
   */
  public function isLink(?array $build): bool {
    if (!(isset($build[0]) && isset($build[0]['#type']) && $build[0]['#type'] === 'link' && isset($build[0]['#url']))) {
      return FALSE;
    }

    if (!$build[0]['#url'] instanceof URL) {
      return FALSE;
    }

    return TRUE;
  }

  /**
   * Get Languages or a single Language.
   *
   * @param string $language
   *   The Language 2 letter code or 'current' for currently active language.
   *
   * @return array
   *   An array of languages or the requested language.
   */
  public function getLanguages($language = NULL) {
    $languages = \Drupal::languageManager()->getLanguages();
    $currentLanguage = \Drupal::languageManager()->getCurrentLanguage()->getId();

    if ($language) {
      $key = isset($languages[$language]) ? $language : NULL;
      $key ??= $currentLanguage;

      return [
        'name' => $languages[$key]->getName(),
        'id' => $languages[$key]->getId(),
        'direction' => $languages[$key]->getDirection(),
        'locked' => $languages[$key]->isLocked(),
        'active' => $languages[$key]->getId() === $currentLanguage,
      ];
    }

    $langs = array_map(function($lang) use ($currentLanguage) {
      return [
        'name' => $lang->getName(),
        'id' => $lang->getId(),
        'direction' => $lang->getDirection(),
        'locked' => $lang->isLocked(),
        'active' => $lang->getId() === $currentLanguage,
      ];
    }, $languages);

    // Return active language first.
    uasort($langs, function($a, $b) {
      return $b['active'] <=> $a['active'];
    });

    return $langs;
  }

  /**
   * Return a Drupal URL object.
   *
   * @param string $url
   * @return static
   *   A new Url object based on user input.
   */
  public function urlFromUserInput(string $url, array $options = []) {
    return \Drupal\Core\Url::fromUserInput($url, $options);
  }
}
