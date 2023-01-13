/**
 * Common functionality for all loaders.
 */
export const common = (config: Record<string, any>) => `

const cacheStringFunction = (fn) => {
  const cache = Object.create(null)
  return (str => {
    const hit = cache[str]
    return hit || (cache[str] = fn(str))
  })
}

const hyphenateRE = /\B([A-Z])/g

const hyphenate = cacheStringFunction(str =>
  str.replace(hyphenateRE, '-$1').toLowerCase()
)

const getTagName = (path) => {
  const filename = path.split('/').at(-1)
  return filename ? \`${config.prefix}-\${hyphenate(filename.replace(/\.(idle|visible|eager|lazy)\.ce\.(vue|tsx|jsx|ts|js)$/, ''))}\` : ''
}
`

/**
 * Intersection Observer based loader for loading components when entering
 * the viewport.
 */
export const visibleLoader = (modules: Record<string, any>) => `
class CustomElementLoader {
  #options
  #modules

  constructor(modules) {
    this.#options = {
      root: null,
      rootMargin: '50%',
      threshold: [...new Array(10).fill(0).map((_, idx) => idx / 10), 1],
    }

    this.#modules = {}

    for (const path in modules) {
      const tagname = getTagName(path)
      if (!tagname) continue

      this.#modules[tagname] = {
        mod: modules[path],
        tagname,
        path,
        loaded: false
      }
    }
  }

  load(ctx) {
    for (const [key, value] of Object.entries(this.#modules)) {
      this.#modules[key].io = new IntersectionObserver((entries, observer) => this.ioCallback(entries, observer, key), this.#options)
      const items = ctx.querySelectorAll(key)
      ctx.querySelectorAll(key).forEach(ce => this.#modules[key].io.observe(ce))
    }
    return this
  }

  ioCallback(entries, observer, tagname) {
    entries.forEach((entry) => {
      if (entry.isIntersecting && tagname in this.#modules) {
        if (this.#modules[tagname].path.match(/vue$/)) {
          this.#modules[tagname].mod().then(async(mod) => {
            const { defineCustomElement } = await import('@ueberbit/vite-plugin-drupal/ApiCustomElements')
            customElements.define(tagname, defineCustomElement(mod.default))
          })
        } else {
          this.#modules[tagname].mod().then(async(mod) => {
            try {
              customElements.define(tagname, mod[Object.keys(mod)[0]])
            } catch(e) {
              console.error(e)
            }
          })
        }
        observer.disconnect()
        delete this.#modules[tagname]
      }
    })
  }
}

const visibleCe = ${modules}

window.customElementLoader = new CustomElementLoader(visibleCe).load(document)

Drupal.behaviors.customElementLoader = {
  attach(context) {
    context !== document && window.customElementLoader.load(context)
  },
}
`

/**
 * Lazy load components when the browser is idle.
 * Requires polyfill for Safari.
 */
export const idleLoader = (modules: Record<string, any>) => `
const idleLoader = async () => {
  const idleCE = ${modules}

  for (const path in idleCE) {
    const tagname = getTagName(path)
    if (!tagname) continue
    if (path.match(/vue$/)) {
      const { defineCustomElement } = await import('@ueberbit/vite-plugin-drupal/ApiCustomElements')
      customElements.define(tagname, defineCustomElement((await idleCE[path]()).default))
    } else {
      const ce = await idleCE[path]()
      try {
        customElements.define(tagname, ce[Object.keys(ce)[0]])
      } catch(e) {
        console.error(e)
      }
    }
  }
}

if ('requestIdleCallback' in window) {
  requestIdleCallback(() => {
    idleLoader()
  }, {
    timeout: 1000
  })
} else {
  idleLoader()
}
`

/**
 * Eagerly loads components.
 */
export const eagerLoader = (imports: string, modules: string, hasVue: boolean) => `
${imports}
${modules.length > 2
? `
${hasVue && 'import { defineCustomElement } from \'@ueberbit/vite-plugin-drupal/ApiCustomElements\''}

const eagerCE = ${modules}

Object.keys(eagerCE).forEach(ce => {
  ${hasVue
    ? `
    if(eagerCE[ce].type === 'vue') {
      customElements.define(ce, defineCustomElement(eagerCE[ce].name))
    } else {
      customElements.define(ce, eagerCE[ce].name)
    }
    `
    : 'customElements.define(ce, eagerCE[ce].name)'}
})`
: ''}
`

/**
 * Lazy loads components.
 */
export const lazyLoader = (modules: Record<string, any>) => `
;(async () => {
  const lazyCe = ${modules}

  for (const path in lazyCe) {
    const tagname = getTagName(path)
    if (!tagname) continue

    if (path.match(/vue$/)) {
      const { defineCustomElement } = await import('@ueberbit/vite-plugin-drupal/ApiCustomElements')
      customElements.define(tagname, defineCustomElement((await lazyCe[path]()).default))
    } else {
      const ce = await lazyCe[path]()
      try {
        customElements.define(tagname, ce[Object.keys(ce)[0]])
      } catch(e) {
        console.error(e)
      }
    }
  }
})()
`
