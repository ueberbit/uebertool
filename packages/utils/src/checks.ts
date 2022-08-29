import { existsSync, readFileSync, readdirSync } from 'node:fs'

/**
 * Check if project is Drupal.
 * @returns {boolean} true if project is Drupal.
 */
export const isDrupal = () => {
  let drupal = false

  // Drupal Root.
  if (existsSync('composer.json')) {
    const composer = readFileSync('composer.json', 'utf8')
    drupal = !!composer.match(/drupal\//)
  }
  // Drupal Theme or Module.
  else {
    const files = readdirSync('./')
    drupal = !!files.filter(file => file.endsWith('.info.yml')).length
  }

  return drupal
}
