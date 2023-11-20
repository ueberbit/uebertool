/**
 * Strip away color function of current declaration.
 */
function plugin() {
  return {
    postcssPlugin: 'postcss-strip-color',
    Declaration(decl: any) {
      if (decl.value.endsWith('--strip-color')) {
        decl.value = decl.value
          .replace(/^hsl\(|^rgb\(/, '')
          .replace(/\) --strip-color$/, '')
      }
    },
  }
}
plugin.postcss = true

export default plugin
