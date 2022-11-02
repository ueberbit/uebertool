/**
 * Apply Polyfill.
 */
export default class Polyfill {
  name: string
  condition: boolean
  callback: Function

  constructor(name: string, condition: boolean, callback: Function) {
    this.name = name
    this.condition = condition
    this.callback = callback

    !this.condition && this.apply()
  }

  async apply() {
    try {
      await this.callback()
      console.info(`🚀 Applied polyfill for %c${this.name}`, 'color: coral')
    } catch(e) {
      console.info(`💥 Failed to apply polyfill for %c${this.name}`, 'color: coral')
      console.error(e)
    }
  }
}

function requestIdleCallbackShim(callback: IdleRequestCallback, options?: IdleRequestOptions) {
  const timeout = options?.timeout ?? 50
  const start = Date.now()

  return setTimeout(function() {
    callback({
      didTimeout: false,
      timeRemaining: function() {
        return Math.max(0, timeout - (Date.now() - start))
      }
    })
  }, 1)
}

new Polyfill('Container Query', 'container' in document.documentElement.style, () => import('container-query-polyfill'))
new Polyfill('has pseudo', CSS.supports('selector(p:has(p))'), () => import('css-has-pseudo'))
new Polyfill('requestIdleCallback', 'requestIdleCallback' in window, () => (window as any).requestIdleCallback = requestIdleCallbackShim)

