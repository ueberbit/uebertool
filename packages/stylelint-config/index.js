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
      'at-rules',
      {
        type: 'at-rule',
        name: 'supports',
      },
      {
        type: 'at-rule',
        name: 'media',
      },
      'rules',
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
  },
}
