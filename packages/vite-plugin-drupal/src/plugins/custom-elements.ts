import type { Plugin } from 'vite'
import type { Context } from './context'
import { camelize, hyphenate } from '@vue/shared'
import fse from 'fs-extra'
import { glob } from 'tinyglobby'
import { analyzeText, transformAnalyzerResult } from 'web-component-analyzer'
import { common, eagerLoader, idleLoader, lazyLoader, visibleLoader } from '../ce/ceLoader'

const virtualModuleId = 'virtual:vue-ce-loader'
const resolvedVirtualModuleId = `\0${virtualModuleId}`

export default (ctx: Context): Plugin => {
  const tagNameMap = new Set<string>()

  const loaders: Record<string, any> = {
    visible: visibleLoader,
    idle: idleLoader,
    eager: eagerLoader,
    lazy: lazyLoader,
  }

  function cacheStringFunction(fn: (str: string) => Promise<string>) {
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
    return filename ? `${ctx.options.ce.prefix}-${hyphenate(filename.replace(/\.?(idle|visible|eager|lazy)?\.ce\.(vue|tsx|jsx|ts|js)$/, ''))}` : ''
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
    const files = await glob([str], {
      onlyFiles: true,
    })
    const match = str.match(/\.(\w+)\.ce/) || []
    const type = match[1] ?? 'idle'

    if (type === 'eager') {
      const [imports, modules, hasVue] = glob2eager(files)
      return loaders.eager(imports, modules, hasVue)
    }

    return files.length ? loaders[type](glob2modules(files)) : ''
  })

  function extractVueDocs(fileName: string, fileContent: string) {
    const docsBlock = fileContent.match(/<docs[^>]*>([\s\S]*?)<\/docs>/g)
    const tagName = getTagName(fileName)

    tagNameMap.add(tagName)

    if (docsBlock?.length) {
      const code = docsBlock[0].split('\n')
      code.pop()
      code.shift()
      code.push(`class ${camelize(tagName)} extends HTMLElement {}`)
      code.push(`
      declare global {
        interface HTMLElementTagNameMap {
            "${tagName}": ${camelize(tagName)};
        }
      }
      `)
      const text = code.join('\n')
      return text
    }

    return ''
  }

  async function generateVSCodeCustomHTMLData() {
    const files = await glob([
      '(js|templates|components)/**/*.ce.{vue,ts,tsx,js}',
    ], {
      onlyFiles: true,
    })

    const contents = (await Promise.all(files.flatMap(async (fileName) => {
      const fileContent = await fse.readFile(fileName, 'utf-8')

      if (fileName.endsWith('.vue'))
        return extractVueDocs(fileName, fileContent)

      return fileContent
    }))).filter(text => text !== '')

    const { results, program } = analyzeText(contents)
    const vscode = transformAnalyzerResult('vscode', results, program)

    await fse.writeFile('./.uebertool/vscode.html-custom-data.json', vscode)

    const tagNames = `${Array.from(tagNameMap).reduce((a, c) => `${a}
  "${c}": HTMLElement`, `export {}

declare global {
interface HTMLElementTagNameMap {`)}\n  }\n}`

    await fse.writeFile('./.uebertool/custom-elements.d.ts', tagNames)
  }

  return {
    name: 'vite-plugin-uebertool-custom-elements-loader',
    enforce: 'pre',
    async resolveId(id: string) {
      if (id === virtualModuleId)
        return resolvedVirtualModuleId
    },
    async load(id: string) {
      if (id === resolvedVirtualModuleId) {
        let code = [
          await addLoader('*/**/*.eager.ce.(vue|tsx|ts|js|jsx)'),
          await addLoader('*/**/*.idle.ce.(vue|tsx|ts|js|jsx)'),
          await addLoader('*/**/*.lazy.ce.(vue|tsx|ts|js|jsx)'),
          await addLoader('*/**/*.visible.ce.(vue|tsx|ts|js|jsx)'),
        ].join('')

        return code = code ? common(ctx.options.ce) + code : code
      }
    },
    async buildStart() {
      generateVSCodeCustomHTMLData()
    },
    async handleHotUpdate({ file }) {
      if (file.match(/\.ce\./))
        generateVSCodeCustomHTMLData()
    },
  }
}
