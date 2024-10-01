import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import type { Plugin } from 'vite'
import fse from 'fs-extra'
import type { Context } from './context'

const __dirname = dirname(fileURLToPath(import.meta.url))
const staticPath = resolve(__dirname, '../../static')

export default (ctx: Context): Plugin => {
  return {
    name: 'vite-plugin-uebertool-copy-static',
    buildStart() {
      ctx.options.features.resetTheme && fse.copy(staticPath, ctx.config.build?.outDir || 'dist', { overwrite: true })
    },
  }
}
