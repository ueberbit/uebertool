/**
 * Transforms pixel value to rem.
 * @param {number} px - Pixel value which for transformation.
 * @param {number} base - Base pixel value.
 * @param {number} precision - Precision of decimal value.
 * @returns {string} Pixel value relative to base.
 */
export function remCalc(px: number, base = 16, precision = 3) {
  return `${(px / base)
    .toFixed(precision)
    .replace(/\.?0*$/, '')}rem`
}
