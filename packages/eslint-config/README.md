# @ueberbit/eslint-config

[![npm](https://img.shields.io/npm/v/@ueberbit/eslint-config?color=fbfe7b&label=)](https://npmjs.com/package/@ueberbit/eslint-config)

- based on [@antfu/eslint-config](https://github.com/antfu/eslint-config) ❤️
  - Single quotes, no semi
  - Auto fix for formatting (aimed to be used standalone without Prettier)
  - TypeScript, Vue, React out-of-box
  - Lint also for json, yaml, markdown
  - Sorted imports, dangling commas for cleaner commit diff
  - Reasonable defaults, best practices, only one-line of config
- gitignored files are ignored by default

## Usage

### Install

```bash
pnpm add -D @ueberbit/eslint-config
```

### Config `eslint.config.js`

```js
import config from '@ueberbit/eslint-config'

export default config()
```

### Script `package.json`

```json
{
  "scripts": {
    "lint": "eslint . --cache"
  }
}
```

`--cache` only re-lints changed files. Add `.eslintcache` to your `.gitignore`.

### Ignores

Besides the gitignored files, `tsconfig.json`, `composer.json`, `composer.lock`,
`.storybook`, `*.stories.jsx`, `_deprecated` and `.uebertool` are ignored. Pass
`ignores` to extend the list, un-ignore with a `!pattern` or replace it with a
function:

```js
export default config({
  ignores: ['legacy/**', '!**/composer.json'],
})
```
