const plugins = ['stylelint-order']
const ignoreFiles = [
  '*.min.*',
  'dist',
  'output',
  'public',
  'temp',
  'web/core',
  'web/libraries',
  'web/**/contrib',
  'web/profiles',
  'web/sites/**/files',
]
const rules = {
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
  // 'declaration-block-trailing-semicolon': null,
  // 'no-descending-specificity': null,
}

module.exports = {
  extends: [
    'stylelint-config-standard',
    'stylelint-config-recess-order',
  ],
  plugins,
  ignoreFiles,
  rules,
  overrides: [
    {
      files: ['*.vue', '**/*.vue'],
      extends: [
        'stylelint-config-standard',
        'stylelint-config-recommended-vue',
        'stylelint-config-recess-order',
        'stylelint-config-html',
      ],
      plugins,
      ignoreFiles,
      rules: {
        ...rules,
        'value-keyword-case': [
          'lower',
          {
            ignoreFunctions: ['v-bind'],
          },
        ],
      },
    },
  ],
}
