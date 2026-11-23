import { LoaderDemo } from './_LoaderDemo'

/**
 * Loaded with the "eager" strategy. Eager elements need a default export.
 */
export default class LoadEager extends LoaderDemo {
  static mode = 'eager'
}
