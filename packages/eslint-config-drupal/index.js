// @ts-check
import fs from 'node:fs'

/**
 * Check if project is Drupal.
 * @returns {boolean} true if project is Drupal.
 */
function isDrupal() {
  // Drupal Root.
  if (fs.existsSync('composer.json')) {
    try {
      const { require = {}, 'require-dev': requireDev = {} } = JSON.parse(fs.readFileSync('composer.json', 'utf8'))
      return Object.keys({
        ...require,
        ...requireDev,
      }).some(name => name.startsWith('drupal/'))
    }
    catch {
      return false
    }
  }

  // Drupal Theme or Module.
  return fs.readdirSync('./').some(file => file.endsWith('.info.yml'))
}

/**
 * Drupal specific ESLint rules.
 * @typedef {import('eslint').Linter.Config} FlatConfigItem
 * @returns {FlatConfigItem[]} ESLint configuration.
 */
function config() {
  return isDrupal()
    ? [
        {
          name: 'ueberbit/drupal',
          files: ['**/*.{js,mjs,cjs,ts,mts,cts,vue}'],
          languageOptions: {
            globals: {
              Drupal: 'readonly',
              drupalSettings: 'readonly',
              drupalTranslations: 'readonly',
              jQuery: 'readonly',
              _: 'readonly',
              Cookies: 'readonly',
              Backbone: 'readonly',
              Modernizr: 'readonly',
              loadjs: 'readonly',
              Popper: 'readonly',
              Shepherd: 'readonly',
              Sortable: 'readonly',
              once: 'readonly',
              CKEDITOR: 'readonly',
              CKEditor5: 'readonly',
              tabbable: 'readonly',
            },
          },
        },
      ]
    : []
}

export default config
