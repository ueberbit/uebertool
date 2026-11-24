const { join } = require('node:path')
const process = require('node:process')

module.exports = {
  extends: [
    'stylelint-config-standard',
    'stylelint-config-recess-order',
  ],
  plugins: ['stylelint-order'],
  // Stylelint resolves relative ignoreFiles globs against the directory of the
  // config that declares them, i.e. node_modules/@ueberbit/stylelint-config.
  // Anchor them at the project (cwd) instead, so they match project files.
  ignoreFiles: [
    '**/*.min.*',
    '**/dist/**',
    'output/**',
    'public/**',
    'temp/**',
    '**/web/core/**',
    '**/web/libraries/**',
    '**/web/**/contrib/**',
    '**/web/profiles/**',
    '**/web/sites/**/files/**',
  ].map(glob => join(process.cwd(), glob)),
  rules: {
    'import-notation': 'string',
    'order/order': [
      'dollar-variables',
      'custom-properties',
      'declarations',
      {
        type: 'at-rule',
        name: 'apply',
      },
      'rules',
      'at-rules',
    ],
    'at-rule-no-unknown': [
      true,
      {
        ignoreAtRules: [
          'tailwind',
          'apply',
          'variants',
          'responsive',
          'screen',
          'layer',
          'import-glob',
          'unocss-placeholder',
          'custom-media',
          'scope',
          'view-transition',
          // Tailwind v4
          'theme',
          'custom-variant',
          'utility',
          'variant',
          'source',
          'reference',
          'plugin',
          'config',
        ],
      },
    ],
    // Tailwind's @apply takes utility classes, not the CSS prelude it validates.
    'at-rule-prelude-no-invalid': [
      true,
      {
        ignoreAtRules: ['apply'],
      },
    ],
    'function-no-unknown': [
      true,
      {
        ignoreFunctions: ['theme'],
      },
    ],
    'no-descending-specificity': null,
    'selector-class-pattern': '^([a-z][a-z0-9]*)(-[a-z0-9]+)*((__([a-z][a-z0-9]*)(-[a-z0-9]+)*)?(--([a-z][a-z0-9]*)(-[a-z0-9]+)*)?)$',
  },
}
