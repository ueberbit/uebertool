# @ueberbit/tailwind

Utilities for Tailwindcss

[![npm](https://img.shields.io/npm/v/@ueberbit/tailwind?color=fbfe7b&label=)](https://npmjs.com/package/@ueberbit/tailwind)

## Usage

### Install

```bash
pnpm add -D eslint @ueberbit/tailwind
```

### Examples

#### Remcalc

Convert pixel values to rem values.

```js
fontSize: {
  8: remCalc(8),
}

```

#### semantic colors

Use css custom properties in your tailwind config. In combination with strip-color postcss plugin you have good DX in your editor, while also being compatible with tailwinds color opacity.

```js
colors: {
  ...semanticColors(['primary'], ['DEFAULT', 'content', '100', '200', '400', '600', '800', '900'], 'hsl'),
}
```

```css
--c-primary: theme("colors.blue.900") --strip-color;
--c-primary-100: theme("colors.blue.100") --strip-color;
--c-primary-200: theme("colors.blue.200") --strip-color;
--c-primary-400: theme("colors.blue.400") --strip-color;
--c-primary-600: theme("colors.blue.600") --strip-color;
--c-primary-800: theme("colors.blue.800") --strip-color;
--c-primary-900: theme("colors.blue.900") --strip-color;
--c-primary-content: theme("colors.white") --strip-color;
--c-error-form: hsl(10deg 100% 33%) --strip-color;
```