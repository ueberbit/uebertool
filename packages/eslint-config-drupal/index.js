const fs = require('fs')

/**
 * Check if project is Drupal.
 * @returns {boolean} true if project is Drupal.
 */
const isDrupal = () => {
  let drupal = false

  // Drupal Root.
  if (fs.existsSync('composer.json')) {
    const composer = fs.readFileSync('composer.json', 'utf8')
    drupal = composer.match(/drupal\//)
  }
  // Drupal Theme or Module.
  else {
    const files = fs.readdirSync('./')
    drupal = !!files.filter(file => file.endsWith('.info.yml')).length
  }

  return drupal
}

/**
 * Drupal specific ESLint rules.
 */
const config = isDrupal()
  ? {
      globals: {
        Drupal: true,
        drupalSettings: true,
        drupalTranslations: true,
        jQuery: true,
        _: true,
        Cookies: true,
        Backbone: true,
        Modernizr: true,
        loadjs: true,
        Popper: true,
        Shepherd: true,
        Sortable: true,
        once: true,
        CKEDITOR: true,
        CKEditor5: true,
        tabbable: true,
      },
      ignorePatterns: [
        '**/config/sync/**/*.yml',
        '**/core',
        '**/contrib',
        '**/files',
        '**/vendor',
      ],
    }
  : {}

module.exports = config
