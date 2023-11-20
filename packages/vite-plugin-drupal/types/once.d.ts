/**
 * Ensures a JavaScript callback is only executed once on a set of elements.
 *
 * Filters a NodeList or array of elements, removing those already processed
 * by a callback with a given id.
 * This method adds a `data-once` attribute on DOM elements. The value of
 * this attribute identifies if a given callback has been executed on that
 * element.
 *
 * @global
 *
 * @example <caption>Basic usage</caption>
 * const elements = once('my-once-id', '[data-myelement]');
 * @example <caption>Input parameters accepted</caption>
 * // NodeList.
 * once('my-once-id', document.querySelectorAll('[data-myelement]'));
 * // Array or Array-like of Element.
 * once('my-once-id', jQuery('[data-myelement]'));
 * // A CSS selector without a context.
 * once('my-once-id', '[data-myelement]');
 * // A CSS selector with a context.
 * once('my-once-id', '[data-myelement]', document.head);
 * // Single Element.
 * once('my-once-id', document.querySelector('#some-id'));
 * @example <caption>Using a single element</caption>
 * // Once always returns an array, even when passing a single element. Some
 * // forms that can be used to keep code readable.
 * // Destructuring:
 * const [myElement] = once('my-once-id', document.body);
 * // By changing the resulting array, es5 compatible.
 * const myElement = once('my-once-id', document.body).shift();
 *
 * @param {string} id
 *   The id of the once call.
 * @param {NodeList|Array.<Element>|Element|string} selector
 *   A NodeList or array of elements.
 * @param {Document|Element} [context]
 *   An element to use as context for querySelectorAll.
 *
 * @return {Array.<Element>}
 *   An array of elements that have not yet been processed by a once call
 *   with a given id.
 */
declare function once<T extends Element>(id: string, selector: NodeList | Array<Element> | Element | string, context?: Document | Element): T[]
declare namespace once {
  /**
   * Removes a once id from an element's data-drupal-once attribute value.
   *
   * If a once id is removed from an element's data-drupal-once attribute value,
   * the JavaScript callback associated with that id can be executed on that
   * element again.
   *
   * @method once.remove
   *
   * @example <caption>Basic usage</caption>
   * const elements = once.remove('my-once-id', '[data-myelement]');
   * @example <caption>Input parameters accepted</caption>
   * // NodeList.
   * once.remove('my-once-id', document.querySelectorAll('[data-myelement]'));
   * // Array or Array-like of Element.
   * once.remove('my-once-id', jQuery('[data-myelement]'));
   * // A CSS selector without a context.
   * once.remove('my-once-id', '[data-myelement]');
   * // A CSS selector with a context.
   * once.remove('my-once-id', '[data-myelement]', document.head);
   * // Single Element.
   * once.remove('my-once-id', document.querySelector('#some-id'));
   *
   * @param {string} id
   *   The id of a once call.
   * @param {NodeList|Array.<Element>|Element|string} selector
   *   A NodeList or array of elements to remove the once id from.
   * @param {Document|Element} [context]
   *   An element to use as context for querySelectorAll.
   *
   * @return {Array.<Element>}
   *   A filtered array of elements that had been processed by the provided id,
   *   and are now able to be processed again.
   */
  function remove(id: string, selector: string | Element | NodeList | Element[], context?: Element | Document): Element[]
  /**
   * Finds elements that have been processed by a given once id.
   *
   * Behaves like {@link once} and {@link once.remove} without changing the DOM.
   * To select all DOM nodes processed by a given id, use {@link once.find}.
   *
   * @method once.filter
   *
   * @example <caption>Basic usage</caption>
   * const filteredElements = once.filter('my-once-id', '[data-myelement]');
   * @example <caption>Input parameters accepted</caption>
   * // NodeList.
   * once.filter('my-once-id', document.querySelectorAll('[data-myelement]'));
   * // Array or Array-like of Element.
   * once.filter('my-once-id', jQuery('[data-myelement]'));
   * // A CSS selector without a context.
   * once.filter('my-once-id', '[data-myelement]');
   * // A CSS selector with a context.
   * once.filter('my-once-id', '[data-myelement]', document.head);
   * // Single Element.
   * once.filter('my-once-id', document.querySelector('#some-id'));
   *
   * @param {string} id
   *   The id of the once call.
   * @param {NodeList|Array.<Element>|Element|string} selector
   *   A NodeList or array of elements to remove the once id from.
   * @param {Document|Element} [context]
   *   An element to use as context for querySelectorAll.
   *
   * @return {Array.<Element>}
   *   A filtered array of elements that have already been processed by the
   *   provided once id.
   */
  function filter(id: string, selector: string | Element | NodeList | Element[], context?: Element | Document): Element[]
  /**
   * Finds elements that have been processed by a given once id.
   *
   * Query the 'context' element for elements that already have the
   * corresponding once id value.
   *
   * @method once.find
   *
   * @example <caption>Basic usage</caption>
   * const oncedElements = once.find('my-once-id');
   * @example <caption>Input parameters accepted</caption>
   * // Call without parameters, return all elements with a `data-once` attribute.
   * once.find();
   * // Call without a context.
   * once.find('my-once-id');
   * // Call with a context.
   * once.find('my-once-id', document.head);
   *
   * @param {string} [id]
   *   The id of the once call.
   * @param {Document|Element} [context]
   *   Scope of the search for matching elements.
   *
   * @return {Array.<Element>}
   *   A filtered array of elements that have already been processed by the
   *   provided once id.
   */
  function find(id?: string, context?: Element | Document): Element[]
}
