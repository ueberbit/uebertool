/**
 * A registered custom element: tag name (computed at build time), module
 * path and whether it is a Vue SFC.
 */
export interface CeEntry {
  tag: string
  path: string
  vue: boolean
}

/**
 * Generates `{ 'prefix-foo': { vue: true, load: () => import('/path') } }`.
 */
function toModuleMap(entries: CeEntry[]) {
  return `{\n${entries.map(({ tag, path, vue }) =>
    `  ${JSON.stringify(tag)}: { vue: ${vue}, load: () => import(${JSON.stringify(`/${path}`)}) },\n`,
  ).join('')}}`
}

/**
 * Common functionality for the idle, lazy and visible loaders.
 */
export function common() {
  return `
let __ceApi

const __ceDefine = async (tag, { load, vue }) => {
  if (customElements.get(tag)) return
  const mod = await load()
  const ctor = vue
    ? (await (__ceApi ??= import('@ueberbit/vite-plugin-drupal/ApiCustomElements'))).defineCustomElement(mod.default)
    : mod[Object.keys(mod)[0]]
  if (!customElements.get(tag)) customElements.define(tag, ctor)
}

const __ceDefineSafe = (tag, ce) => __ceDefine(tag, ce).catch((e) => {
  console.error(\`[uebertool] Failed to define <\${tag}>\`, e)
})

const __ceDefineAll = ces => Promise.allSettled(
  Object.entries(ces).map(([tag, ce]) => __ceDefineSafe(tag, ce)),
)
`
}

/**
 * Intersection Observer based loader for loading components when entering
 * the viewport.
 */
export function visibleLoader(entries: CeEntry[]) {
  return `
class CustomElementLoader {
  #pending
  #observed = new WeakSet()
  #io

  constructor(ces) {
    this.#pending = new Map(Object.entries(ces))
    this.#io = new IntersectionObserver(entries => this.#onIntersect(entries), {
      root: null,
      rootMargin: '50%',
      threshold: 0,
    })
  }

  load(ctx) {
    for (const tag of this.#pending.keys()) {
      ctx.querySelectorAll(tag).forEach((el) => {
        if (this.#observed.has(el)) return
        this.#observed.add(el)
        this.#io.observe(el)
      })
    }
    return this
  }

  #onIntersect(entries) {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue
      const tag = entry.target.localName
      const ce = this.#pending.get(tag)
      if (!ce) {
        this.#io.unobserve(entry.target)
        continue
      }
      this.#pending.delete(tag)
      document.querySelectorAll(tag).forEach(el => this.#io.unobserve(el))
      this.#io.unobserve(entry.target)
      __ceDefineSafe(tag, ce)
    }
  }
}

window.customElementLoader = new CustomElementLoader(${toModuleMap(entries)}).load(document)

if (typeof Drupal !== 'undefined') {
  Drupal.behaviors.customElementLoader = {
    attach(context) {
      context !== document && window.customElementLoader.load(context)
    },
  }
}
`
}

/**
 * Lazy load components when the browser is idle.
 * Requires polyfill for Safari.
 */
export function idleLoader(entries: CeEntry[]) {
  return `
const __ceIdle = ${toModuleMap(entries)}
const __ceIdleLoad = () => __ceDefineAll(__ceIdle)

if ('requestIdleCallback' in window) {
  requestIdleCallback(__ceIdleLoad, {
    timeout: 1000,
  })
} else {
  __ceIdleLoad()
}
`
}

/**
 * Eagerly loads components.
 */
export function eagerLoader(entries: CeEntry[]) {
  if (!entries.length)
    return ''

  const hasVue = entries.some(entry => entry.vue)
  const imports = entries.map(({ path }, i) => `import __ce${i} from ${JSON.stringify(`~/${path}`)}\n`).join('')
  const modules = `{\n${entries.map(({ tag, vue }, i) => `  ${JSON.stringify(tag)}: [__ce${i}, ${vue}],\n`).join('')}}`

  return `
${imports}${hasVue ? 'import { defineCustomElement as __ceDefineVue } from \'@ueberbit/vite-plugin-drupal/ApiCustomElements\'\n' : ''}
const __ceEager = ${modules}

for (const [tag, [ce, vue]] of Object.entries(__ceEager)) {
  if (customElements.get(tag)) continue
  try {
    customElements.define(tag, ${hasVue ? 'vue ? __ceDefineVue(ce) : ce' : 'ce'})
  } catch (e) {
    console.error(\`[uebertool] Failed to define <\${tag}>\`, e)
  }
}
`
}

/**
 * Lazy loads components.
 */
export function lazyLoader(entries: CeEntry[]) {
  return `
__ceDefineAll(${toModuleMap(entries)})
`
}
