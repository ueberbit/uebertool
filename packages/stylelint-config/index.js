const { join } = require('node:path')
const process = require('node:process')

module.exports = {
  extends: [
    'stylelint-config-standard',
    'stylelint-config-recess-order',
  ],
  plugins: [
    'stylelint-order',
    join(__dirname, 'plugins/tailwind.mjs'),
  ],
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
          'slot',
        ],
      },
    ],
    // Tailwind v4 entry files stack these at the top without blank lines.
    'at-rule-empty-line-before': [
      'always',
      {
        except: ['blockless-after-same-name-blockless', 'first-nested'],
        ignore: ['after-comment'],
        ignoreAtRules: [
          'import',
          'reference',
          'config',
          'plugin',
          'source',
          'custom-variant',
        ],
      },
    ],
    // Allow Tailwind v4 theme namespace resets: `--*: initial`, `--color-*: initial`.
    'custom-property-pattern': '^(\\*|([a-z][a-z0-9]*)(-[a-z0-9]+)*(-\\*)?)$',
    // Tailwind's build-time functions are not CSS the validator knows about.
    'declaration-property-value-no-unknown': [
      true,
      {
        ignoreProperties: {
          '/.*/': [/(?:^|[^\w-])(?:--)?(?:theme|spacing|alpha)\(/],
        },
      },
    ],
    'media-query-no-invalid': [
      true,
      {
        ignoreFunctions: ['theme', '--theme'],
      },
    ],
    // `&` inside these is scoped by Tailwind when the at-rule is expanded.
    'nesting-selector-no-missing-scoping-root': [
      true,
      {
        ignoreAtRules: ['custom-variant', 'utility', 'variant'],
      },
    ],
    // `@utility` bodies may nest `@media` with bare declarations.
    'no-invalid-position-declaration': [
      true,
      {
        ignoreAtRules: ['utility'],
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
    // Only applied to Tailwind files (`@import "tailwindcss"` or `@reference`).
    'ueberbit/tailwind-no-raw-breakpoint': true,
    'ueberbit/tailwind-no-v3-at-rule': true,
    'ueberbit/tailwind-no-v3-theme-path': true,
    'ueberbit/tailwind-no-layer-utility': true,
    'ueberbit/tailwind-no-important': [
      true,
      { severity: 'warning' },
    ],
    'ueberbit/tailwind-apply-order': true,
    'selector-class-pattern': '^([a-z][a-z0-9]*)(-[a-z0-9]+)*((__([a-z][a-z0-9]*)(-[a-z0-9]+)*)?(--([a-z][a-z0-9]*)(-[a-z0-9]+)*)?)$',
  },
}
