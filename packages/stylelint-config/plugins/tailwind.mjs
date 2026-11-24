// Rules that only apply to Tailwind v4 files: files that import Tailwind
// (`@import "tailwindcss"`) or reference a Tailwind stylesheet (`@reference`).
import { dirname } from 'node:path'
import process from 'node:process'
import { __unstable__loadDesignSystem as loadDesignSystem } from '@tailwindcss/node'
import stylelint from 'stylelint'

const { createPlugin, utils: { report, ruleMessages, validateOptions } } = stylelint

const TAILWIND_IMPORT = /^\s*(?:url\(\s*)?["']tailwindcss(?:\/[^"']*)?["']/

function isTailwindFile(root) {
  return root.nodes.some(node => node.type === 'atrule' && (
    node.name === 'reference'
    || (node.name === 'import' && TAILWIND_IMPORT.test(node.params))
  ))
}

function tailwindRule(name, messages, check) {
  const ruleName = `ueberbit/tailwind-${name}`
  const ruleFunction = primary => (root, result) => {
    if (!validateOptions(result, ruleName, {
      actual: primary,
      possible: [true],
    })) {
      return
    }
    if (!isTailwindFile(root))
      return
    return check(root, (node, message, word, fix) => report({
      result,
      ruleName,
      node,
      message,
      word,
      fix: fix && { apply: fix, node },
    }), ruleMessages(ruleName, messages))
  }
  ruleFunction.ruleName = ruleName
  ruleFunction.messages = ruleMessages(ruleName, messages)
  ruleFunction.meta = {
    url: 'https://github.com/ueberbit/uebertool/tree/main/packages/stylelint-config',
    fixable: true,
  }
  return createPlugin(ruleName, ruleFunction)
}

// theme() / --theme() calls may reference breakpoints and are fine.
const THEME_CALL = /(?<![\w-])(?:--)?theme\([^)]*\)/g
const WIDTH_FEATURE = /(?<![\w-])(?:min-|max-)?width(?![\w-])/
const LITERAL_LENGTH = /(?<![\w.-])(?:\d+(?:\.\d+)?|\.\d+)(?:px|r?em|ch|ex|vw|vh|vi|vb|vmin|vmax|cm|mm|in|pt|pc|q)(?![\w-])/i

const noRawBreakpoint = tailwindRule('no-raw-breakpoint', {
  rejected: query => `Unexpected raw breakpoint "${query}". Use \`@variant md { … }\` or \`theme(--breakpoint-md)\``,
}, (root, warn, messages) => {
  root.walkAtRules('media', (atRule) => {
    const params = atRule.params.replace(THEME_CALL, '')
    if (WIDTH_FEATURE.test(params) && LITERAL_LENGTH.test(params))
      warn(atRule, messages.rejected(atRule.params), atRule.params)
  })
})

const V3_AT_RULES = {
  screen: 'Use `@variant md { … }`',
  variants: 'Use `@utility` for custom utilities; variants apply automatically',
  responsive: 'Use `@utility` for custom utilities; variants apply automatically',
}

const noV3AtRule = tailwindRule('no-v3-at-rule', {
  rejected: (name, hint) => `Unexpected Tailwind v3 at-rule "@${name}". ${hint}`,
}, (root, warn, messages) => {
  root.walkAtRules((atRule) => {
    const name = atRule.name.toLowerCase()
    if (V3_AT_RULES[name])
      warn(atRule, messages.rejected(name, V3_AT_RULES[name]), `@${atRule.name}`)
    // `@tailwind utilities` still exists in v4; base, components etc. do not.
    else if (name === 'tailwind' && !/^\s*utilities\b/.test(atRule.params))
      warn(atRule, messages.rejected(`tailwind ${atRule.params}`, 'Use `@import "tailwindcss";`'), `@${atRule.name}`)
  })
})

// theme(colors.red.500) / theme('spacing.4'); v4 takes a variable: theme(--color-red-500).
const V3_THEME_PATH = /(?<![\w-])theme\((?!\s*["']?--)[^)]*\)/g

const noV3ThemePath = tailwindRule('no-v3-theme-path', {
  rejected: call => `Unexpected Tailwind v3 theme path "${call}". Use the theme variable, e.g. \`var(--color-red-500)\` or \`--theme(--color-red-500)\``,
}, (root, warn, messages) => {
  const check = (node, value) => {
    for (const [call] of value.matchAll(V3_THEME_PATH))
      warn(node, messages.rejected(call), call)
  }
  root.walkDecls(decl => check(decl, decl.value))
  root.walkAtRules(atRule => check(atRule, atRule.params))
})

const noLayerUtility = tailwindRule('no-layer-utility', {
  rejected: () => 'Unexpected class in "@layer utilities". Use `@utility name { … }` so variants like `hover:` work',
}, (root, warn, messages) => {
  root.walkAtRules('layer', (atRule) => {
    // `@layer components` stays valid in v4 for component classes.
    if (!atRule.nodes || atRule.params.trim() !== 'utilities')
      return
    for (const node of atRule.nodes) {
      if (node.type === 'rule')
        warn(node, messages.rejected(), node.selector)
    }
  })
})

// `block!` (v4), `!block` / `hover:!block` (v3) and a trailing `!important`.
const isImportant = token => token.endsWith('!') || token.startsWith('!') || token.includes(':!')

const noImportant = tailwindRule('no-important', {
  rejected: token => `Unexpected important modifier "${token}". Fix the specificity instead of forcing it`,
}, (root, warn, messages) => {
  root.walkAtRules('apply', (atRule) => {
    for (const token of atRule.params.split(/\s+/)) {
      if (isImportant(token))
        warn(atRule, messages.rejected(token), token)
    }
  })
})

// Loading a design system takes a while, so share it between files that use
// the same Tailwind entry. Keyed by base directory and entry CSS.
const designSystems = new Map()

function cachedDesignSystem(css, base) {
  const key = `${base}\0${css}`
  if (!designSystems.has(key))
    designSystems.set(key, loadDesignSystem(css, { base }).catch(() => null))
  return designSystems.get(key)
}

// The file's own Tailwind setup, or the stylesheet it references. Falls back to
// Tailwind's defaults when that can't be resolved (e.g. a bundler alias), which
// still orders every core utility correctly.
async function designSystemFor(root) {
  const file = root.source?.input.file
  const base = file
    ? dirname(file)
    : process.cwd()
  const reference = root.nodes.find(node => node.type === 'atrule' && node.name === 'reference')
  const css = reference
    ? `@import ${reference.params};`
    : root.toString()
  return await cachedDesignSystem(css, base)
    ?? await cachedDesignSystem('@import "tailwindcss";', base)
}

function compareOrder([, a], [, b]) {
  // Unknown classes first, like prettier-plugin-tailwindcss.
  if (a === b)
    return 0
  if (a === null)
    return -1
  if (b === null)
    return 1
  return a < b
    ? -1
    : 1
}

const applyOrder = tailwindRule('apply-order', {
  expected: sorted => `Expected Tailwind classes in @apply to be ordered as "${sorted}"`,
}, async (root, warn, messages) => {
  const applies = []
  root.walkAtRules('apply', atRule => applies.push(atRule))
  if (!applies.length)
    return
  const designSystem = await designSystemFor(root)
  if (!designSystem)
    return
  for (const atRule of applies) {
    const tokens = atRule.params.trim().split(/\s+/)
    const important = tokens.filter(token => token === '!important')
    const classes = tokens.filter(token => token !== '!important')
    const sorted = designSystem.getClassOrder(classes)
      .toSorted(compareOrder)
      .map(([name]) => name)
    if (sorted.every((name, i) => name === classes[i]))
      continue
    const params = [
      ...sorted,
      ...important,
    ].join(' ')
    warn(atRule, messages.expected(params), undefined, () => {
      atRule.params = params
    })
  }
})

export default [
  applyOrder,
  noRawBreakpoint,
  noV3AtRule,
  noV3ThemePath,
  noLayerUtility,
  noImportant,
]
