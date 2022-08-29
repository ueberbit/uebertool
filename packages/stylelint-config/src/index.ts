import { existsSync } from 'node:fs'
import { JSONConfig } from '@ueberbit/utils'

const __VSCODE__ = `${process.env.INIT_CWD}/.vscode/settings.json`
const __FILE__ = `${process.env.INIT_CWD}/composer.json`

/**
 * Add stylelint relevant settings to vscode workspace settings.
 */
const vscode = new JSONConfig(__VSCODE__)
vscode
  .add(['css.validate'], false)
  .add(['emmet.includeLanguages', 'tailwindcss'], 'postcss')
  .add(['files.associations', '*.css'], 'tailwindcss')
  .add(['files.associations', '*.css'], 'tailwindcss')
  .add(['stylelint.snippet'], ['tailwindcss'])
  .add(['stylelint.validate'], ['tailwindcss'])
  .save()

if (existsSync(__FILE__)) {
  const config = new JSONConfig(__FILE__)

  config
    .add(['extra', 'drupal-scaffold', 'file-mapping', '[web-root]/.csslintrc'], false)
    .save()
}
