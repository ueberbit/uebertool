/* eslint-disable no-console */
/* eslint-disable no-new */

/**
 * Apply Polyfill.
 */
class Polyfill {
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
    }
    catch (e) {
      console.info(`💥 Failed to apply polyfill for %c${this.name}`, 'color: coral')
      console.error(e)
    }
  }
}

function requestIdleCallbackShim(callback: IdleRequestCallback, options?: IdleRequestOptions) {
  const timeout = options?.timeout ?? 50
  const start = Date.now()

  return setTimeout(() => {
    callback({
      didTimeout: false,
      timeRemaining() {
        return Math.max(0, timeout - (Date.now() - start))
      },
    })
  }, 1)
}

new Polyfill('requestIdleCallback', 'requestIdleCallback' in window, () => (window as any).requestIdleCallback = requestIdleCallbackShim)

export {}

console.log('ployfill')
