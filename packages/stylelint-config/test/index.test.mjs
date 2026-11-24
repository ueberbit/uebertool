import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
// No vitest in this workspace; node:test keeps the package dependency-free.
// eslint-disable-next-line test/no-import-node-test
import { test } from 'node:test'
import stylelint from 'stylelint'

const configFile = new URL('../index.js', import.meta.url).pathname

async function lint(code) {
  const { results: [result] } = await stylelint.lint({ code, configFile })
  return result.warnings
    .toSorted((a, b) => a.line - b.line)
    .map(({ rule, line }) => `${line}: ${rule}`)
}

test('Tailwind v4 syntax lints clean', async () => {
  const code = await readFile(new URL('tailwind-v4.css', import.meta.url), 'utf8')
  assert.deepEqual(await lint(code), [])
})

test('the Tailwind exceptions do not swallow real errors', async () => {
  const warnings = await lint([
    '@foo {',
    '  color: red;',
    '}',
    '',
    '.a {',
    '  --camelCase: 1;',
    '',
    '  padding: foo;',
    '}',
    '',
    '@media (width >= foo(1px)) {',
    '  .b {',
    '    color: red;',
    '  }',
    '}',
    '',
  ].join('\n'))
  assert.deepEqual(warnings, [
    '1: at-rule-no-unknown',
    '6: custom-property-pattern',
    '8: declaration-property-value-no-unknown',
    '11: media-query-no-invalid',
  ])
})

const V3_AND_RAW = [
  '@media (min-width: 768px) {',
  '  .a {',
  '    color: theme(colors.red.500);',
  '  }',
  '}',
  '',
  '@media screen and (width >= 48rem) {',
  '  .b {',
  '    padding: theme("spacing.4");',
  '  }',
  '}',
  '',
  '@screen md {',
  '  .c {',
  '    color: red;',
  '  }',
  '}',
  '',
  '@tailwind base;',
  '',
  '@layer utilities {',
  '  .d {',
  '    color: red;',
  '  }',
  '}',
  '',
  '@layer components {',
  '  .e {',
  '    color: red;',
  '  }',
  '}',
  '',
].join('\n')

// [line, rule] in V3_AND_RAW
const TAILWIND_WARNINGS = [
  [1, 'no-raw-breakpoint'],
  [3, 'no-v3-theme-path'],
  [7, 'no-raw-breakpoint'],
  [9, 'no-v3-theme-path'],
  [13, 'no-v3-at-rule'],
  [19, 'no-v3-at-rule'],
  [22, 'no-layer-utility'],
]

for (const header of ['@import "tailwindcss";', '@import \'tailwindcss\' source(none);', '@reference "../app.css";']) {
  test(`v3 syntax and raw breakpoints are errors in Tailwind files (${header})`, async () => {
    const warnings = await lint(`${header}\n${V3_AND_RAW}`)
    assert.deepEqual(
      warnings.filter(w => w.includes('ueberbit/')),
      // The header shifts every line by one.
      TAILWIND_WARNINGS.map(([line, rule]) => `${line + 1}: ueberbit/tailwind-${rule}`),
    )
  })
}

test('important modifiers in @apply are warnings', async () => {
  const { results: [result] } = await stylelint.lint({
    code: '@reference "../app.css";\n\n.a {\n  @apply block! hover:!flex !p-4 font-bold !important;\n}\n',
    configFile,
  })
  assert.deepEqual(
    result.warnings.filter(({ rule }) => rule === 'ueberbit/tailwind-no-important').map(({ rule, severity, text }) => `${severity}: ${rule} ${text.match(/"(.+?)"/)[1]}`),
    [
      'block!',
      'hover:!flex',
      '!p-4',
      '!important',
    ].map(word => `warning: ueberbit/tailwind-no-important ${word}`),
  )
})

async function fixApply(code) {
  const codeFilename = new URL('fixture.css', import.meta.url).pathname
  const { results: [result] } = await stylelint.lint({ code, configFile, codeFilename })
  const { code: fixed } = await stylelint.lint({
    code,
    configFile,
    codeFilename,
    fix: true,
  })
  return {
    rules: result.warnings.map(({ rule }) => rule).filter(rule => rule === 'ueberbit/tailwind-apply-order'),
    apply: fixed.match(/@apply [^;]*;/)[0],
  }
}

test('@apply classes are sorted in Tailwind\'s order and autofixed', async () => {
  const { rules, apply } = await fixApply('@import "tailwindcss";\n\n.a {\n  @apply hover:bg-red-500 p-4 unknown-class flex bg-white rounded-lg !important;\n}\n')
  assert.deepEqual(rules, ['ueberbit/tailwind-apply-order'])
  // Unknown classes first, variants after base utilities, !important last.
  assert.equal(apply, '@apply unknown-class flex rounded-lg bg-white p-4 hover:bg-red-500 !important;')
})

test('@apply order knows the file\'s own @utility classes', async () => {
  const { apply } = await fixApply('@import "tailwindcss";\n\n@utility stack {\n  display: grid;\n}\n\n.a {\n  @apply p-4 stack;\n}\n')
  assert.equal(apply, '@apply stack p-4;')
})

test('@apply order falls back to Tailwind defaults for unresolvable references', async () => {
  const { rules, apply } = await fixApply('@reference "@/css/tailwind.css";\n\n.a {\n  @apply p-4 flex;\n}\n')
  assert.deepEqual(rules, ['ueberbit/tailwind-apply-order'])
  assert.equal(apply, '@apply flex p-4;')
})

test('sorted @apply passes', async () => {
  const { rules } = await fixApply('@import "tailwindcss";\n\n.a {\n  @apply flex p-4 hover:bg-red-500;\n}\n')
  assert.deepEqual(rules, [])
})

test('Tailwind rules ignore plain CSS files', async () => {
  const warnings = await lint(`@import "./base.css";\n${V3_AND_RAW}`)
  assert.deepEqual(warnings.filter(w => w.includes('ueberbit/')), [])
})
