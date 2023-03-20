module.exports = {
  extends: [
    'stylelint-config-standard',
    'stylelint-config-recess-order',
  ],
  plugins: ['stylelint-order'],
  ignoreFiles: [
    '*.min.*',
    'dist',
    '**/dist',
    'output',
    'public',
    'temp',
    'web/core',
    'web/libraries',
    'web/**/contrib',
    'web/profiles',
    'web/sites/**/files',
  ],
  rules: {
    // 'selector-anb-no-unmatchable': null,
    'max-line-length': [
      120,
      {
        ignorePattern: '/^\\s*(@import|@apply)/',
      },
    ],
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
        ],
      },
    ],
    'function-no-unknown': [
      true,
      {
        ignoreFunctions: ['theme'],
      },
    ],
    'declaration-block-trailing-semicolon': null,
    'no-descending-specificity': null,
    'selector-class-pattern': '^([a-z][a-z0-9]*)(-[a-z0-9]+)*((__([a-z][a-z0-9]*)(-[a-z0-9]+)*)?(--([a-z][a-z0-9]*)(-[a-z0-9]+)*)?)$',
  },
}
