import { LoaderDemo } from './_LoaderDemo'

/**
 * Loaded with the "lazy" strategy of the custom element loader.
 */
export class LoadLazy extends LoaderDemo {
  static mode = 'lazy'
}
