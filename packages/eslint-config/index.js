// @ts-check
import { readGitignoreFiles } from 'eslint-gitignore'
import antfu from '@antfu/eslint-config'
import drupal from '@ueberbit/eslint-config-drupal'

/**
 * @typedef {import('@antfu/eslint-config').ConfigNames} AntfuConfigNames
 * @typedef {'ueberbit/drupal'} CustomConfigNames
 * @typedef {AntfuConfigNames | CustomConfigNames} ConfigNames
 * @typedef {import('@antfu/eslint-config').TypedFlatConfigItem} TypedFlatConfigItem
 * @typedef {import('eslint-flat-config-utils').FlatConfigComposer<TypedFlatConfigItem, ConfigNames>} antfu
 */

/**
 * Drupal specific ESLint rules.
 * @returns {antfu} ESLint configuration.
 */
export default () => antfu()
  .append(drupal())
  .append({
    ignores: [
      'tsconfig.json',
      '.vscode/**/*',
      ...readGitignoreFiles(),
    ],
  })
