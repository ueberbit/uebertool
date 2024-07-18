// @ts-check
import path from 'node:path'
import url from 'node:url'
import { readGitignoreFiles } from 'eslint-gitignore'
import antfu from '@antfu/eslint-config'
import drupal from '@ueberbit/eslint-config-drupal'

const __filename = url.fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

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
  return antfu(options, ...userConfigs)
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
        ...readGitignoreFiles({ cwd: __dirname }),
      ],
    })
}
export default config
