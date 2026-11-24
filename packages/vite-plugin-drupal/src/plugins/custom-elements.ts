import type { Logger, Plugin } from 'vite'
import type { CeEntry } from '../ce/ceLoader'
import type { Context } from './context'
import path from 'node:path'
import { camelize, hyphenate } from '@vue/shared'
import fse from 'fs-extra'
import { glob } from 'tinyglobby'
import { common, eagerLoader, idleLoader, lazyLoader, visibleLoader } from '../ce/ceLoader'

const virtualModuleId = 'virtual:vue-ce-loader'
const resolvedVirtualModuleId = `\0${virtualModuleId}`

type Strategy = 'eager' | 'idle' | 'lazy' | 'visible'

/**
 * Only `*.{strategy}.ce.*` files are registered as elements by the loaders.
 * Other `*.ce.vue` files are nested components.
 */
const REGISTERED_CE_REGEX = /\.(idle|visible|eager|lazy)\.ce\.(?:vue|tsx|jsx|ts|js)$/
const CE_REGEX = /\.ce\.(?:vue|tsx|jsx|ts|js)$/

const globOptions = {
  onlyFiles: true,
  followSymbolicLinks: false,
  ignore: [
    '**/node_modules/**',
    '**/dist/**',
    '**/vendor/**',
    '**/.uebertool/**',
  ],
}

export default (ctx: Context): Plugin => {
  let logger: Logger | undefined

  const isRegistered = (fileName: string) => REGISTERED_CE_REGEX.test(fileName)

  const getTagName = (file: string): string => {
    const filename = path.basename(file)
    return `${ctx.options.ce.prefix}-${hyphenate(filename.replace(REGISTERED_CE_REGEX, ''))}`
  }

  async function buildLoaderModule() {
    const files = await glob(['*/**/*.{eager,idle,lazy,visible}.ce.{vue,tsx,ts,js,jsx}'], globOptions)
    files.sort()

    const byStrategy: Record<Strategy, CeEntry[]> = {
      eager: [],
      idle: [],
      lazy: [],
      visible: [],
    }
    const tags = new Map<string, string>()
    for (const file of files) {
      const strategy = file.match(REGISTERED_CE_REGEX)?.[1] as Strategy | undefined
      if (strategy) {
        const tag = getTagName(file)
        if (tags.has(tag))
          logger?.warn(`[uebertool] Duplicate custom element <${tag}>: ${tags.get(tag)} and ${file}`, { timestamp: true })
        tags.set(tag, file)
        byStrategy[strategy].push({
          tag,
          path: file,
          vue: file.endsWith('.vue'),
        })
      }
    }

    const dynamic = [
      byStrategy.idle.length
        ? idleLoader(byStrategy.idle)
        : '',
      byStrategy.lazy.length
        ? lazyLoader(byStrategy.lazy)
        : '',
      byStrategy.visible.length
        ? visibleLoader(byStrategy.visible)
        : '',
    ].join('')

    return eagerLoader(byStrategy.eager) + (dynamic
      ? common() + dynamic
      : '')
  }

  function extractVueDocs(fileName: string, fileContent: string) {
    if (!isRegistered(fileName))
      return ''

    const docsBlock = fileContent.match(/<docs[^>]*>([\s\S]*?)<\/docs>/g)
    const tagName = getTagName(fileName)

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

  let wca: Promise<typeof import('web-component-analyzer') | undefined> | undefined

  /**
   * web-component-analyzer pulls in TypeScript, so it is loaded lazily and
   * only in dev. If it cannot be loaded, the custom data is skipped once.
   */
  function loadWca() {
    return wca ??= import('web-component-analyzer').catch((e) => {
      const message = `[uebertool] web-component-analyzer could not be loaded, skipping .uebertool/vscode.html-custom-data.json: ${e instanceof Error
        ? e.message
        : e}`
      logger
        ? logger.warn(message, { timestamp: true })
        : console.warn(message)
      return undefined
    })
  }

  async function generateVSCodeCustomHTMLData(files: string[]) {
    const analyzer = await loadWca()
    if (!analyzer)
      return

    const contents = (await Promise.all(files.map(async (fileName) => {
      const fileContent = await fse.readFile(fileName, 'utf-8')

      if (fileName.endsWith('.vue'))
        return extractVueDocs(fileName, fileContent)

      return fileContent
    }))).filter(text => text !== '')

    const { results, program } = analyzer.analyzeText(contents)
    const vscode = analyzer.transformAnalyzerResult('vscode', results, program)

    await fse.outputFile('./.uebertool/vscode.html-custom-data.json', vscode)
  }

  async function generateTagNames(files: string[]) {
    // Derived from the current files on every run, so renamed or deleted
    // elements disappear, and sorted, so the output is stable between builds.
    const vueTagNames = files
      .filter(fileName => fileName.endsWith('.vue') && isRegistered(fileName))
      .map(getTagName)
      .sort()

    const tagNames = `${vueTagNames.reduce((a, c) => `${a}
  "${c}": HTMLElement`, `export {}

declare global {
interface HTMLElementTagNameMap {`)}\n  }\n}`

    await fse.outputFile('./.uebertool/custom-elements.d.ts', tagNames)
  }

  async function generate() {
    const files = await glob(['(js|templates|components)/**/*.ce.{vue,ts,tsx,js}'], globOptions)

    await generateTagNames(files)

    if (ctx.dev)
      await generateVSCodeCustomHTMLData(files)
  }

  // Debounced and serialized: a run requested while another is in progress
  // is queued once and starts after it.
  let timer: ReturnType<typeof setTimeout> | undefined
  let running: Promise<void> | undefined
  let queued = false

  async function runGenerate(): Promise<void> {
    if (running) {
      queued = true
      return running
    }

    running = generate().catch((e) => {
      logger?.error(`[uebertool] Failed to generate custom element data: ${e instanceof Error
        ? e.message
        : e}`, { timestamp: true })
    })
    await running
    running = undefined

    if (queued) {
      queued = false
      return runGenerate()
    }
  }

  function scheduleGenerate() {
    clearTimeout(timer)
    timer = setTimeout(() => void runGenerate(), 300)
  }

  return {
    name: 'vite-plugin-uebertool-custom-elements-loader',
    enforce: 'pre',
    configResolved(config) {
      logger = config.logger
    },
    async resolveId(id: string) {
      if (id === virtualModuleId)
        return resolvedVirtualModuleId
    },
    async load(id: string) {
      if (id === resolvedVirtualModuleId)
        return buildLoaderModule()
    },
    async buildStart() {
      // Don't block the dev server on web-component-analyzer.
      if (ctx.dev)
        scheduleGenerate()
      else
        await runGenerate()
    },
    configureServer(server) {
      // Watch the files directly: handleHotUpdate is not called when a file
      // is deleted, which left removed elements in the generated data.
      server.watcher.on('all', (event, file) => {
        if (!['add', 'change', 'unlink'].includes(event))
          return

        const filename = path.basename(file)
        if (!CE_REGEX.test(filename))
          return

        scheduleGenerate()

        // The loader module lists the registered files, so it must be rebuilt
        // when one is added or removed.
        if (event !== 'change' && isRegistered(filename)) {
          const client = server.environments.client
          const mod = client.moduleGraph.getModuleById(resolvedVirtualModuleId)
          if (mod)
            client.moduleGraph.invalidateModule(mod)
          client.hot.send({ type: 'full-reload' })
        }
      })
    },
    buildEnd() {
      clearTimeout(timer)
    },
  }
}
