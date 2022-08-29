import { JSONConfig } from '@ueberbit/utils'

const __VSCODE__ = `${process.env.INIT_CWD}/.vscode/settings.json`

/**
 * Add phpcs relevant settings to vscode workspace settings.
 */
const vscode = new JSONConfig(__VSCODE__)
vscode
  .add(['phpsab.fixerEnable'], true)
  .add(['phpsab.snifferEnable'], true)
  .add(['phpsab.executablePathCS'], './vendor/bin/phpcs')
  .add(['phpsab.executablePathCBF'], './vendor/bin/phpcbf')
  .add(['phpsab.standard'], './node_modules/@ueberbit/phpcs-config-drupal/ruleset.xml')
  .add(['phpsab.debug'], true)
  .save()
