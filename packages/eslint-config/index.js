const { readGitignoreFiles } = require('eslint-gitignore')

module.exports = {
  extends: [
    '@antfu',
    '@ueberbit/eslint-config-drupal',
  ],
  /**
   * Ignore common dist paths by default.
   */
  ignorePatterns: [
    'tsconfig.json',
    '.vscode/**/*',
    ...readGitignoreFiles(),
  ],
}
