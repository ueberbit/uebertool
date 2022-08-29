import { existsSync } from 'node:fs'
import { JSONConfig } from '@ueberbit/utils'

const __COMPOSER__ = `${process.env.INIT_CWD}/composer.json`

/**
 * Disable Drupal scaffolding of eslint config.
 */
if (existsSync(__COMPOSER__)) {
  const composer = new JSONConfig(__COMPOSER__)
  composer.add(['extra', 'drupal-scaffold', 'file-mapping', '[web-root]/.eslintrc.json'], false).save()
}
