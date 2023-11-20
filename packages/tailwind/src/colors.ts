type colorModel = 'rgb' | 'hsl'

/**
 * Wrap custom property with tailwind opacity value.
 * @param {string} value - color value.
 * @param {string} model - color model.
 * @returns {string} a custom property.
 */
export function color(value: string, model: colorModel) {
  return ({ opacityValue }: { opacityValue: any }) => {
    return opacityValue !== undefined ? `${model}(var(${value}) / ${opacityValue})` : `${model}(var(${value}))`
  }
}

/**
 * Generate semantic color values.
 * @param {string[]} names Array of names. E.g. primary, secondary.
 * @param {string[]} steps Array of steps. E.g. light, dark.
 * @returns Tailwind Color Object
 */
export function semanticColors(names: string[], steps: string[], model: colorModel) {
  return names.reduce((a, c) => {
    return {
      ...a,
      [c]: steps.reduce((aa, cc) => {
        return {
          ...aa,
          [cc]: color(`--c-${c}${cc === 'DEFAULT' ? '' : `-${cc}`}`, model),
        }
      }, {}),
    }
  }, {})
}
