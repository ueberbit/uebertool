/// <reference types="@types/js-cookie" />

const Drupal: Drupal
const drupalSettings: Drupal.DrupalSettings

const Cookies: Cookies.CookiesStatic & {
  noConflict?(): Cookies.CookiesStatic;
}

interface Drupal {
  Ajax: new (
    base: string,
    element: HTMLElement,
    elementSettings: Drupal.Ajax.ElementSettings
  ) => Drupal.Ajax
  AjaxCommands: new () => Drupal.AjaxCommands
  AjaxError: (
    xmlhttp: XMLHttpRequest,
    uri: string,
    customMessage: string
  ) => void
  ajax: (settings: { base: string; element: HTMLElement }) => Drupal.Ajax
  /**
   * Defines a behavior to be run during attach and detach phases.
   *
   * Attaches all registered behaviors to a page element.
   *
   * Behaviors are event-triggered actions that attach to page elements,
   * enhancing default non-JavaScript UIs. Behaviors are registered in the
   * {@link Drupal.behaviors} object using the method 'attach' and optionally
   * also 'detach'.
   *
   * {@link Drupal.attachBehaviors} is added below to the `jQuery.ready` event
   * and therefore runs on initial page load. Developers implementing Ajax in
   * their solutions should also call this function after new page content has
   * been loaded, feeding in an element to be processed, in order to attach all
   * behaviors to the new content.
   *
   * Behaviors should use `var elements =
   * once('behavior-name', selector, context);` to ensure the behavior is
   * attached only once to a given element. (Doing so enables the reprocessing
   * of given elements, which may be needed on occasion despite the ability to
   * limit behavior attachment to a particular element.)
   *
   * @example
   * Drupal.behaviors.behaviorName = {
   *   attach: function (context, settings) {
   *     // ...
   *   },
   *   detach: function (context, settings, trigger) {
   *     // ...
   *   }
   * };
   *
   * @param {HTMLDocument|HTMLElement} [context=document]
   *   An element to attach behaviors to.
   * @param {object} [settings=drupalSettings]
   *   An object containing settings for the current context. If none is given,
   *   the global {@link drupalSettings} object is used.
   *
   * @see Drupal~behaviorAttach
   * @see Drupal.detachBehaviors
   *
   * @throws {Drupal~DrupalBehaviorError}
   */
  attachBehaviors: (
    context: Document | HTMLElement | Element,
    settings: Drupal.DrupalSettings
  ) => void
  behaviors: Record<string, Drupal.Behavior>

  /**
   * Encodes special characters in a plain-text string for display as HTML.
   *
   * @param {string} str
   *   The string to be encoded.
   *
   * @return {string}
   *   The encoded string.
   *
   * @ingroup sanitization
   */
  checkPlain: (str: string) => string
  debounce: (func: Function, wait: number, immediate: boolean) => Function
  /**
   * Detaches registered behaviors from a page element.
   *
   * Developers implementing Ajax in their solutions should call this function
   * before page content is about to be removed, feeding in an element to be
   * processed, in order to allow special behaviors to detach from the content.
   *
   * Such implementations should use `once.filter()` and `once.remove()` to find
   * elements with their corresponding `Drupal.behaviors.behaviorName.attach`
   * implementation, i.e. `once.remove('behaviorName', selector, context)`,
   * to ensure the behavior is detached only from previously processed elements.
   *
   * @param {HTMLDocument|HTMLElement} [context=document]
   *   An element to detach behaviors from.
   * @param {object} [settings=drupalSettings]
   *   An object containing settings for the current context. If none given,
   *   the global {@link drupalSettings} object is used.
   * @param {string} [trigger='unload']
   *   A string containing what's causing the behaviors to be detached. The
   *   possible triggers are:
   *   - `'unload'`: The context element is being removed from the DOM.
   *   - `'move'`: The element is about to be moved within the DOM (for example,
   *     during a tabledrag row swap). After the move is completed,
   *     {@link Drupal.attachBehaviors} is called, so that the behavior can undo
   *     whatever it did in response to the move. Many behaviors won't need to
   *     do anything simply in response to the element being moved, but because
   *     IFRAME elements reload their "src" when being moved within the DOM,
   *     behaviors bound to IFRAME elements (like WYSIWYG editors) may need to
   *     take some action.
   *   - `'serialize'`: When an Ajax form is submitted, this is called with the
   *     form as the context. This provides every behavior within the form an
   *     opportunity to ensure that the field elements have correct content
   *     in them before the form is serialized. The canonical use-case is so
   *     that WYSIWYG editors can update the hidden textarea to which they are
   *     bound.
   *
   * @throws {Drupal~DrupalBehaviorError}
   *
   * @see Drupal~behaviorDetach
   * @see Drupal.attachBehaviors
   */
  detachBehaviors: (
    context?: Document | HTMLElement | Element,
    settings?: object,
    trigger?: string
  ) => void

  /**
   * Encodes a Drupal path for use in a URL.
   *
   * For aesthetic reasons slashes are not escaped.
   *
   * @param {string} item
   *   Unencoded path.
   *
   * @return {string}
   *   The encoded path.
   */
  encodePath: (item: string) => string

  /**
   * Formats a string containing a count of items.
   *
   * This function ensures that the string is pluralized correctly. Since
   * {@link Drupal.t} is called by this function, make sure not to pass
   * already-localized strings to it.
   *
   * See the documentation of the server-side
   * \Drupal\Core\StringTranslation\TranslationInterface::formatPlural()
   * function for more details.
   *
   * @param {number} count
   *   The item count to display.
   * @param {string} singular
   *   The string for the singular case. Please make sure it is clear this is
   *   singular, to ease translation (e.g. use "1 new comment" instead of "1
   *   new"). Do not use @count in the singular string.
   * @param {string} plural
   *   The string for the plural case. Please make sure it is clear this is
   *   plural, to ease translation. Use @count in place of the item count, as in
   *   "@count new comments".
   * @param {object} [args]
   *   An object of replacements pairs to make after translation. Incidences
   *   of any key in this array are replaced with the corresponding value.
   *   See {@link Drupal.formatString}.
   *   Note that you do not need to include @count in this array.
   *   This replacement is done automatically for the plural case.
   * @param {object} [options]
   *   The options to pass to the {@link Drupal.t} function.
   *
   * @return {string}
   *   A translated string.
   */
  formatPlural: (
    count: number,
    singular: string,
    plural: string,
    argsopt?: object,
    optionsopt?: object
  ) => string

  /**
   * Replaces placeholders with sanitized values in a string.
   *
   * @param {string} str
   *   A string with placeholders.
   * @param {object} args
   *   An object of replacements pairs to make. Incidences of any key in this
   *   array are replaced with the corresponding value. Based on the first
   *   character of the key, the value is escaped and/or themed:
   *    - `'!variable'`: inserted as is.
   *    - `'@variable'`: escape plain text to HTML ({@link Drupal.checkPlain}).
   *    - `'%variable'`: escape text and theme as a placeholder for user-
   *      submitted content ({@link Drupal.checkPlain} +
   *      `{@link Drupal.theme}('placeholder')`).
   *
   * @return {string}
   *   The formatted string.
   *
   * @see Drupal.t
   */
  formatString: (str: string, args: object) => string
  Message: Drupal.Message.Message

  /**
   * Replaces substring.
   *
   * The longest keys will be tried first. Once a substring has been replaced,
   * its new value will not be searched again.
   *
   * @param {string} str
   *   A string with placeholders.
   * @param {object} args
   *   Key-value pairs.
   * @param {Array|null} keys
   *   Array of keys from `args`. Internal use only.
   *
   * @return {string}
   *   The replaced string.
   */
  stringReplace: (
    str: string,
    args: object,
    keys: Array<any> | null
  ) => string

  /**
   * Translates strings to the page language, or a given language.
   *
   * See the documentation of the server-side t() function for further details.
   *
   * @param {string} str
   *   A string containing the English text to translate.
   * @param {Object.<string, string>} [args]
   *   An object of replacements pairs to make after translation. Incidences
   *   of any key in this array are replaced with the corresponding value.
   *   See {@link Drupal.formatString}.
   * @param {object} [options]
   *   Additional options for translation.
   * @param {string} [options.context='']
   *   The context the source string belongs to.
   *
   * @return {string}
   *   The formatted string.
   *   The translated string.
   */
  t: (
    str: string,
    args?: Record<string, string>,
    options?: { context?: string }
  ) => string
  /**
   * Helper to rethrow errors asynchronously.
   *
   * This way Errors bubbles up outside of the original callstack, making it
   * easier to debug errors in the browser.
   *
   * @param {Error|string} error
   *   The error to be thrown.
   */
  throwError: (error: Error | string) => void

  /**
   * Returns the URL to a Drupal page.
   *
   * @param {string} path
   *   Drupal path to transform to URL.
   *
   * @return {string}
   *   The full URL.
   */
  url: (path: string) => string
}


declare namespace Drupal {
  // Todo.
  interface Ajax {}
  // Todo.
  interface AjaxCommands {}

  type DrupalSettings = Record<string, any>
  type BehaviorAttach = (
    context: Document | HTMLElement,
    settings: object | null
  ) => void
  type BehaviorDetach = (
    context: Document | HTMLElement,
    settings: object,
    trigger: string
  ) => void
  interface Behavior {
    attach?: BehaviorAttach
    detach?: BehaviorDetach
  }

  export {
    Ajax,
    AjaxCommands,
    Behavior,
    BehaviorAttach,
    BehaviorDetach,
    DrupalSettings,
  }
}

declare namespace Drupal.Message {

  type MessageType = 'status' | 'warning' | 'error'
  type MessageOptions = {
    type?: MessageType
    id?: string
    priority?: 'assertive'
    announce?: string 
  }
  interface Message {

  /**
   * Constructs a new instance of the Drupal.Message class.
   *
   * This provides a uniform interface for adding and removing messages to a
   * specific location on the page.
   *
   * @param {HTMLElement} messageWrapper
   *   The zone where to add messages. If no element is provided an attempt is
   *   made to determine a default location.
   *
   * @return {Drupal.Message~messageDefinition}
   *   Class to add and remove messages.
   */
    new(messageWrapper?: HTMLElement): Message

    /**
     * Attempt to determine the default location for
     * inserting JavaScript messages or create one if needed.
     *
     * @return {HTMLElement}
     *   The default destination for JavaScript messages.
     */
    static defaultWrapper(): HTMLElement

    /**
     * Provide an object containing the available message types.
     *
     * @return {Object}
     *   An object containing message type strings.
     */
    static getMessageTypeLabels(): Record<MessageType, string>

    /**
     * Sequentially adds a message to the message area.
     *
     * @name Drupal.Message~messageDefinition.add
     *
     * @param {string} message
     *   The message to display
     * @param {object} [options]
     *   The context of the message.
     * @param {string} [options.id]
     *   The message ID, it can be a simple value: `'filevalidationerror'`
     *   or several values separated by a space: `'mymodule formvalidation'`
     *   which can be used as an explicit selector for a message.
     * @param {string} [options.type=status]
     *   Message type, can be either 'status', 'error' or 'warning'.
     * @param {string} [options.announce]
     *   Screen-reader version of the message if necessary. To prevent a message
     *   being sent to Drupal.announce() this should be an empty string.
     * @param {string} [options.priority]
     *   Priority of the message for Drupal.announce().
     *
     * @return {string}
     *   ID of message.
     */
    add(message: string, options?: MessageOptions): MessageOptions.id
    
    /**
     * Select a message based on id.
     *
     * @name Drupal.Message~messageDefinition.select
     *
     * @param {string} id
     *   The message id to delete from the area.
     *
     * @return {Element}
     *   Element found.
     */
    select(id: string): Element

    /**
     * Removes messages from the message area.
     *
     * @name Drupal.Message~messageDefinition.remove
     *
     * @param {string} id
     *   Index of the message to remove, as returned by
     *   {@link Drupal.Message~messageDefinition.add}.
     *
     * @return {number}
     *   Number of removed messages.
     */
    remove(id: string): number

    /**
     * Removes all messages from the message area.
     *
     * @name Drupal.Message~messageDefinition.clear
     */
    clear(): void

    /**
     * Helper to call Drupal.announce() with the right parameters.
     *
     * @param {string} message
     *   Displayed message.
     * @param {object} options
     *   Additional data.
     * @param {string} [options.announce]
     *   Screen-reader version of the message if necessary. To prevent a message
     *   being sent to Drupal.announce() this should be `''`.
     * @param {string} [options.priority]
     *   Priority of the message for Drupal.announce().
     * @param {string} [options.type]
     *   Message type, can be either 'status', 'error' or 'warning'.
     */
    static announce(message: string, type: MessageType): void
    
    /**
     * Function for creating the internal message wrapper element.
     *
     * @param {HTMLElement} messageWrapper
     *   The message wrapper.
     *
     * @return {HTMLElement}
     *   The internal wrapper DOM element.
     */
    static messageInternalWrapper(messageWrapper: HTMLElement): HTMLElement
  }

  export {
    MessageType,
    MessageOptions,
    Message
  }
}

declare namespace Drupal.theme {
  // message(): HTMLElement
}

declare namespace Drupal.Ajax {
  interface ElementSettings {
    url: string
    event?: string | null
    keypress?: boolean
    selector: string | null
    effect?: string
    speed?: string | number
    method?: string
    progress?: {
      type?: string
      message?: string
    }
    submit?: {
      js?: boolean
    }
    dialog?: object
    dialogType?: string
    prevent?: string
  }

  export { ElementSettings }
}
