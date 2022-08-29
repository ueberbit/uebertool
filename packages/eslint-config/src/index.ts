import { JSONConfig } from '@ueberbit/utils'

const __VSCODE__ = `${process.env.INIT_CWD}/.vscode/settings.json`
const __PKG__ = `${process.env.INIT_CWD}/package.json`

/**
 * Add eslint relevant settings to vscode workspace settings.
 */
const vscode = new JSONConfig(__VSCODE__)
vscode
  .add(['editor.codeActionsOnSave'], {
    'source.fixAll': false,
    'source.fixAll.eslint': true, // this allows ESLint to auto fix on save
    'source.organizeImports': false, // eslint does this.
  })
  .add(['eslint.codeAction.showDocumentation', 'enable'], false)
  .add(['eslint.quiet'], true)
  .add(['eslint.validate'], ['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'vue', 'html', 'markdown', 'json', 'jsonc', 'json5'])
  .save()

/**
 * Add prettier settings.
 */
const pkg = new JSONConfig(__PKG__)
pkg
  .add(['prettier'], {
    printWidth: 200,
    semi: false,
    singleQuote: true,
  })
  .save()
