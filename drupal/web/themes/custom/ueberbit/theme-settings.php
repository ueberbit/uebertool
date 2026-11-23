<?php

/**
 * @file
 * Theme settings form for UEBERBIT theme.
 */

/**
 * Implements hook_form_system_theme_settings_alter().
 */
function ueberbit_form_system_theme_settings_alter(&$form, &$form_state) {

  $form['ueberbit'] = [
    '#type' => 'details',
    '#title' => t('UEBERBIT'),
    '#open' => TRUE,
  ];

  $form['ueberbit']['font_size'] = [
    '#type' => 'number',
    '#title' => t('Font size'),
    '#min' => 12,
    '#max' => 18,
    '#default_value' => theme_get_setting('font_size'),
  ];

}
