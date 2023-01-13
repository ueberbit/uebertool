import type { Plugin } from 'vite'
import fg from 'fast-glob'
import { camelize, hyphenate } from '@vue/shared'
import { common, eagerLoader, idleLoader, lazyLoader, visibleLoader } from '../ce/ceLoader'
import type { Context } from './context'

const virtualModuleId = 'virtual:vue-ce-loader'
const resolvedVirtualModuleId = `\0${virtualModuleId}`

export default (ctx: Context): Plugin => {
  const loaders: Record<string, any> = {
    visible: visibleLoader,
    idle: idleLoader,
    eager: eagerLoader,
    lazy: lazyLoader,
  }

  function cacheStringFunction(fn: Function) {
    const cache = Object.create(null)
    return (str: string) => {
      const hit = cache[str]
      return hit || (cache[str] = fn(str))
    }
  }

  const glob2modules = (glob: string[]) => `{\n${glob.reduce((a, c) => {
    return `${a}'/${c}': () => import('/${c}'),\n`
  }, '')}}`

  const getTagName = (path: string): string => {
    const filename = path.split('/').at(-1)
    return filename ? `${ctx.options.ce.prefix}-${hyphenate(filename.replace(/\.(idle|visible|eager|lazy)\.ce\.(vue|tsx|jsx|ts|js)$/, ''))}` : ''
  }

  const glob2eager = (glob: string[]) => {
    const ce: Record<string, any> = {}
    const imports = glob.reduce((a, c) => {
      const filename = c.split('/').at(-1) ?? ''
      const name = camelize(filename.replace(/\.eager\.ce\.(vue|tsx|jsx|ts|js)$/, ''))
      const tagname = getTagName(filename)
      ce[tagname] = {
        name,
        type: filename.match(/\.vue$/) ? 'vue' : 'ce',
      }
      return `${a}import ${name} from '~/${c}'\n`
    }, '')
    const hasVue = Object.keys(ce).some(key => ce[key].type === 'vue')
    const modules = JSON.stringify(ce).replace(/("name":)"(\w+)"/g, (_, g1, g2) => `${g1}${g2}`)

    return [
      imports,
      modules,
      hasVue,
    ]
  }

  const addLoader = cacheStringFunction(async (str: string) => {
    const files = await fg([str], {
      onlyFiles: true,
    })
    const match = str.match(/\.(\w+)\.ce/) || []
    const type = match[1] ?? 'idle'

    if (type === 'eager') {
      const [imports, modules] = glob2eager(files)
      return loaders.eager(imports, modules)
    }

    return files.length ? loaders[type](glob2modules(files)) : ''
  })

  return {
    name: 'vite-plugin-custom-elements-loader',
    enforce: 'pre',
    async resolveId(id) {
      if (id === virtualModuleId)
        return resolvedVirtualModuleId
    },
    async load(id) {
      if (id === resolvedVirtualModuleId) {
        let code = [
          await addLoader('*/**/*.eager.ce.(vue|tsx|jsx)'),
          await addLoader('*/**/*.idle.ce.(vue|tsx|jsx)'),
          await addLoader('*/**/*.lazy.ce.(vue|tsx|jsx)'),
          await addLoader('*/**/*.visible.ce.(vue|tsx|jsx)'),
        ].join('')

        return code = code ? common(ctx.options.ce) + code : code
      }
    },
  }
}
