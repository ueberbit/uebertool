<?php

namespace Drupal\uebertool_twig\Twig\Extension;

use Drupal\Component\Utility\Html;
use Drupal\Core\Render\Element;
use Drupal\Core\Render\RendererInterface;
use Drupal\Core\StringTranslation\ByteSizeMarkup;
use Drupal\Core\StringTranslation\TranslatableMarkup;
use Drupal\Core\Template\Attribute;
use Drupal\Core\Url;
use Twig\Extension\AbstractExtension;
use Twig\TwigFilter;
use Twig\TwigFunction;
use Symfony\Component\Yaml\Yaml;

/**
 * Provides field value filters for Twig templates.
 */
class TwigExtrasExtension extends AbstractExtension {

  public function __construct(protected RendererInterface $renderer) {
  }

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
      new TwigFunction('HTML', [$this, 'HTML']),
      new TwigFunction('class', [$this, 'classList']),
      new TwigFunction('tailwind_config', [$this, 'tailwindConfig']),
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

    $fileSize = ByteSizeMarkup::create($files[0]->getSize());
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
   * Retrieves the link url from a link render array or link field item.
   *
   * @return string
   *   Link url.
   */
  public function linkUrl(?array $build): string {
    if ($this->isLink($build)) {
      return $build['#url']->toString() ?? '';
    }

    // BC-Layer, handle array link fields items.
    if (isset($build[0]) && $this->isLink($build[0])) {
      @trigger_error('Calling link_url on field render array is deprecated. Use |field_value|first|link_url instead.', E_USER_DEPRECATED);
      return $this->linkUrl($build[0]);
    }

    return '';
  }

  /**
   * Retrieves the link text from a link render array or link field item.
   *
   * @return string
   *   Link text or empty string.
   */
  public function linkText(?array $build): string {
    if ($this->isLink($build)) {
      return $build['#title'] ?? '';
    }

    // BC-Layer, handle array link fields items.
    if (isset($build[0]) && $this->isLink($build[0])) {
      @trigger_error('Calling link_text on field render array is deprecated. Use |field_value|first|link_text instead.', E_USER_DEPRECATED);
      return $this->linkText($build[0]);
    }

    return '';
  }

  /**
   * Retrieves the link attributes from a link render array or link field item.
   *
   * @return \Drupal\Core\Template\Attribute
   *   Link attributes.
   */
  public function linkAttributes(?array $build): Attribute {
    if ($this->isLink($build)) {
      $element = $this->renderer->renderInIsolation($build);
      $dom = Html::load($element);
      $xpath = new \DOMXPath($dom);

      /** @var \DOMElement[] $elements */
      $element = $xpath->query('//a')->item(0);
      $attribute = new Attribute(array_map(function ($item) {
        return $item->nodeValue;
      }, iterator_to_array($element->attributes->getIterator())));
      $attribute->removeAttribute('href');
      return $attribute;
    }

    // BC-Layer, handle array link fields items.
    if (isset($build[0]) && $this->isLink($build[0])) {
      @trigger_error('Calling link_attrs on field render array is deprecated. Use |field_value|first|link_attrs instead.', E_USER_DEPRECATED);
      return $this->linkAttributes($build[0]);
    }

    return new Attribute();
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
      /** @var \Drupal\Core\Url */
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
  protected function isLink(?array $build): bool {
    if (!(isset($build['#type']) && isset($build['#url']) && $build['#type'] === 'link')) {
      return FALSE;
    }

    if (!$build['#url'] instanceof Url) {
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

  /**
   * Render HTML from string.
   * Only use this for demo purposes.
   *
   * @param string $html
   * @return array Render array.
   */
  public function HTML($html) {
    return [
      '#markup' => $html,
    ];
  }

  /**
   * Shortcut for create_attribute().addClass().
   *
   * @param array $classes
   * @return string
   */
  public function classList(array $classes) {
    $attribute = new Attribute();
    $attribute->addClass($classes);
    return $attribute;
  }

  /**
   * Get Tailwind Config.
   *
   * @param string $key
   * @return mixed
   */
  public function tailwindConfig(?string $key) {
    /** @var Drupal\Core\Theme\ThemeManager */
    $theme_manager = \Drupal::service('theme.manager');
    $theme = $theme_manager->getActiveTheme();

    try {
      $uebertool_dist_theme = current(array_filter($theme->getBaseThemeExtensions(), function($theme) {
        return str_ends_with($theme->getName(), '_dist');
      }));

      if (!$uebertool_dist_theme) {
        return '';
      }

      $yml = Yaml::parseFile(DRUPAL_ROOT . "/{$uebertool_dist_theme->getPath()}/{$uebertool_dist_theme->getName()}.tailwind.yml");

      return $this->getValueByKey($yml, $key);
    } catch (\Exception $e) {
      return '';
    }
  }

  /**
   * Get dynamic value from array.
   */
  function getValueByKey($array, $key) {
    $keys = explode('.', $key);
    $currentValue = $array;
    foreach ($keys as $k) {
      if (isset($currentValue[$k])) {
        $currentValue = $currentValue[$k];
      } else {
        return null;
      }
    }

    return $currentValue;
  }
}
