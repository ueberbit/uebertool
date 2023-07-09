# @ueberbit/stylelint-config

[![npm](https://img.shields.io/npm/v/@ueberbit/stylelint-config?color=fbfe7b&label=)](https://npmjs.com/package/@ueberbit/stylelint-config)

- based on [stylelint-config-standard](https://github.com/stylelint/stylelint-config-standard)
- order rules based on [stylelint-config-recess-order](https://github.com/stormwarning/stylelint-config-recess-order)
- support for tailwind


## Usage

### Install

```bash
pnpm add -D @ueberbit/stylelint-config
```

### Config `.stylelintrc`

```json
{
  "extends": "@ueberbit/stylelint-config"
}
```

Alternatively you can use other [files patterns](https://stylelint.io/user-guide/configure):
- a stylelint property in package.json
- a .stylelintrc file
- a stylelint.config.js file exporting a JS object
- a stylelint.config.cjs file exporting a JS object. When running Stylelint in JavaScript packages that specify "type":"module" in their package.json