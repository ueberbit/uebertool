// @ts-check
import antfu from '@antfu/eslint-config'
import drupal from '@ueberbit/eslint-config-drupal'
import { defu } from 'defu'

/**
 * @template T
 * @typedef {T | Promise<T>} Awaitable
 */

/**
 * @typedef {import('@antfu/eslint-config').ConfigNames} AntfuConfigNames
 * @typedef {'ueberbit/drupal'} CustomConfigNames
 * @typedef {AntfuConfigNames | CustomConfigNames} ConfigNames
 * @typedef {import('@antfu/eslint-config').OptionsConfig} OptionsConfig
 * @typedef {import('@antfu/eslint-config').TypedFlatConfigItem} TypedFlatConfigItem
 * @typedef {Parameters<typeof antfu>} antfuParams
 */

/**
 * Construct an array of ESLint flat config items.
 *
 * @param {OptionsConfig & TypedFlatConfigItem} options
 *  The options for generating the ESLint configurations.
 * @param {Awaitable<TypedFlatConfigItem | TypedFlatConfigItem[]>[]} userConfigs
 *  The user configurations to be merged with the generated configurations.
 * @returns {ReturnType<import('@antfu/eslint-config').antfu>}
 *  The merged ESLint configurations.
 */
function config(options = {}, ...userConfigs) {
  return antfu(defu(options, /** @type {OptionsConfig} */ {
    gitignore: true,
  }), ...userConfigs)
    .append(drupal())
    .append({
      ignores: [
        'tsconfig.json',
        '.vscode/**/*',
        'composer.json',
        'composer.lock',
        '**/.storybook/**',
        '**/*.jsx',
        '**/_deprecated/**',
      ],
    })
}
export default config
