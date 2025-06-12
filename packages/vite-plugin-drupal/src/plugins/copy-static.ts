import type { Plugin } from 'vite'
import type { Context } from './context'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import fse from 'fs-extra'

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
