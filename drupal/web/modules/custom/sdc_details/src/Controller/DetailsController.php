<?php

namespace Drupal\sdc_details\Controller;

use Drupal\Core\Controller\ControllerBase;
use Drupal\Core\Template\Attribute;

/**
 * Returns responses for sdc_demo routes.
 */
class DetailsController extends ControllerBase {

  /**
   * Builds the response.
   */
  public function title() {
    return [
      '#markup' => $this->t('Details'),
    ];
  }

  /**
   * Builds the response.
   */
  public function build() {

    $details = [
      '#type' => 'component',
      '#component' => 'ueberbit:details',
      '#props' => [],
      '#slots' => [
        'summary' => [
          '#type' => 'html_tag',
          '#tag' => 'span',
          '#value' => t('Details Summary'),
        ],
        'content' => [
          '#type' => 'html_tag',
          '#tag' => 'span',
          '#value' => t('Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet.'),
        ],
      ],
    ];

    $build = [
      '#type' => 'container',
      '#attributes' => [
        'style' => [
          'margin: 1rem;',
          'display: grid;',
          'gap: 1rem;',
        ],
      ],
      0 => $details,
      1 => [
        ...$details,
        '#props' => [
          'open' => TRUE,
        ],
      ],
      2 => [
        ...$details,
        '#props' => [
          'disabled' => TRUE,
        ],
      ],
      3 => [
        ...$details,
        '#props' => [
          'attributes' => new Attribute([
            'style' => ['color: var(--gin-color-danger);'],
          ]),
        ],
      ],
      4 => [
        ...$details,
        '#props' => [
          'attributes' => new Attribute([
            'style' => ['color: var(--gin-color-warning);'],
          ]),
        ],
      ],
      5 => [
        ...$details,
        '#props' => [
          'attributes' => new Attribute([
            'style' => ['color: var(--gin-color-green);'],
          ]),
        ],
      ],
      6 => [
        ...$details,
        '#props' => [
          'name' => 'grouped',
        ],
      ],
      7 => [
        ...$details,
        '#props' => [
          'name' => 'grouped',
        ],
      ],
      8 => [
        ...$details,
        '#props' => [
          'name' => 'grouped',
        ],
      ],
    ];

    return $build;
  }

}
