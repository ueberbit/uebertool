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
