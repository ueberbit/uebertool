/// <reference types="js-cookie" />

declare const Drupal: Drupal
declare const drupalSettings: Drupal.DrupalSettings

interface Drupal {
  [key: string]: any;
  /**
   * Ajax constructor. Prefer {@link Drupal.ajax}, which also registers the
   * instance in `Drupal.ajax.instances`.
   *
   * @param base
   *   ID of the element, used as the default `selector` (`#base`).
   * @param element
   *   Element on which event listeners will be bound.
   * @param elementSettings
   *   Settings for this Ajax object.
   */
  Ajax: {
    new (
      base: string | false,
      element: HTMLElement | false,
      elementSettings: Drupal.Ajax.ElementSettings
    ): Drupal.Ajax
    prototype: Drupal.Ajax
  }
  /**
   * The Ajax commands. Add a method to `Drupal.AjaxCommands.prototype` to
   * register a custom command for all Ajax objects.
   */
  AjaxCommands: {
    new (): Drupal.AjaxCommands
    prototype: Drupal.AjaxCommands
  }
  /**
   * Builds an error from a failed Ajax request.
   */
  AjaxError: {
    new (
      xmlhttp: XMLHttpRequest,
      uri: string,
      customMessage?: string
    ): Drupal.AjaxError
    /**
     * Message area used to display Ajax errors.
     */
    messages?: Drupal.Message.Message
  }
  /**
   * Provides Ajax page updating via jQuery $.ajax.
   *
   * @example
   * const ajax = Drupal.ajax({ url: '/my/path', progress: { type: 'fullscreen' } })
   * ajax.commands.myCommand = (ajax, response) => {}
   * ajax.execute()
   */
  ajax: {
    (settings: Drupal.Ajax.Settings): Drupal.Ajax
    /**
     * All Ajax objects created with {@link Drupal.ajax}. Entries may be set to
     * `null` to remove an instance.
     */
    instances: Array<Drupal.Ajax | null>
    /**
     * Ajax objects whose element is no longer in the DOM.
     */
    expired: () => Drupal.Ajax[]
    /**
     * Binds Ajax to all `.use-ajax` links inside the element.
     */
    bindAjaxLinks: (element: Document | Element) => void
  }
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
    context?: Document | Element,
    settings?: Drupal.DrupalSettings
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
  debounce: (func: Function, wait: number, immediate?: boolean) => Function
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
    context?: Document | Element,
    settings?: Drupal.DrupalSettings,
    trigger?: 'unload' | 'move' | 'serialize'
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
  Message: Drupal.Message.MessageConstructor

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
  /**
   * An Ajax object, created by {@link Drupal.ajax} or `new Drupal.Ajax()`.
   *
   * All element settings are copied onto the object, with the defaults
   * applied.
   */
  interface Ajax extends Ajax.ElementSettings {
    /**
     * Processed Ajax URL (`/nojs` is replaced with `/ajax`).
     */
    url: string
    selector: string | null
    progress: false | Ajax.Progress
    /**
     * The commands this object executes. Add a property to handle a custom
     * command for this object only.
     */
    commands: AjaxCommands
    /**
     * Index in `Drupal.ajax.instances`, or `false` if not created with
     * {@link Drupal.ajax}.
     */
    instanceIndex: number | false
    /**
     * The element events are bound to, or `false` if there is none.
     */
    element: HTMLElement | false
    /**
     * The settings this object was created with.
     */
    elementSettings: Ajax.ElementSettings
    /**
     * Whether a request is in progress.
     */
    ajaxing: boolean
    /**
     * Selector of the element that had focus before the response commands ran.
     */
    preCommandsFocusedElementSelector: string | null
    /**
     * Settings passed to `Drupal.attachBehaviors()` after a response, if set.
     */
    settings?: DrupalSettings | null
    /**
     * jQuery wrapper of the element's form, if the element is in a form.
     */
    $form?: any
    /**
     * Options passed to `jQuery.ajax()`.
     */
    options: Ajax.Options

    /**
     * Triggers the Ajax request programmatically.
     *
     * @return
     *   The jqXHR of the request, a rejected Deferred on error, or `undefined`
     *   if a request is already in progress.
     */
    execute(): PromiseLike<unknown> | undefined
    /**
     * Handles a key press on the element: Enter or Space trigger the event.
     */
    keypressResponse(element: HTMLElement, event: KeyboardEvent): void
    /**
     * Handles the bound event and submits the request.
     */
    eventResponse(element: HTMLElement, event: Event): void
    /**
     * Prepares the form values before they are serialized.
     */
    beforeSerialize(element: HTMLElement | false, options: Ajax.Options): void
    /**
     * Modifies the form values before they are submitted.
     */
    beforeSubmit(formValues: Array<{ name: string, value: unknown }>, element: unknown, options: Ajax.Options): void
    /**
     * Prepares the request: disables the element and shows the progress
     * indicator.
     */
    beforeSend(xmlhttprequest: XMLHttpRequest, options: Ajax.Options): void
    setProgressIndicatorBar(): void
    setProgressIndicatorThrobber(): void
    setProgressIndicatorFullscreen(): void
    /**
     * Executes the response commands one after another.
     *
     * @return
     *   Resolves once all commands have finished.
     */
    commandExecutionQueue(response: AjaxCommands.Response[], status?: number | string): Promise<void>
    /**
     * Handles a successful response and runs its commands.
     */
    success(response: AjaxCommands.Response[], status?: number | string): Promise<void>
    /**
     * Builds the jQuery effect used to show new content.
     */
    getEffect(response: { effect?: string, speed?: string | number }): Ajax.Effect
    /**
     * Handles a failed request.
     */
    error(xmlhttprequest: XMLHttpRequest, uri: string, customMessage?: string): void
  }

  /**
   * An error from a failed Ajax request.
   */
  interface AjaxError extends Error {
    name: 'AjaxError'
  }

  /**
   * The available Ajax commands. Add a property to `Drupal.AjaxCommands.prototype`
   * to register a custom command for all Ajax objects.
   */
  interface AjaxCommands {
    [command: string]: AjaxCommands.Command
    /**
     * Inserts the response data into the DOM with `response.method`.
     */
    insert: AjaxCommands.Command
    /**
     * Removes the elements matching `response.selector`.
     */
    remove: AjaxCommands.Command
    /**
     * Marks the elements matching `response.selector` as changed.
     */
    changed: AjaxCommands.Command
    /**
     * Shows `response.text` in an alert.
     */
    alert: AjaxCommands.Command
    /**
     * Announces `response.text` to screen readers.
     */
    announce: AjaxCommands.Command
    /**
     * Redirects to `response.url`.
     */
    redirect: AjaxCommands.Command
    /**
     * Applies `response.argument` as CSS to the elements matching
     * `response.selector`.
     */
    css: AjaxCommands.Command
    /**
     * Merges `response.settings` into `drupalSettings` or the object's
     * settings.
     */
    settings: AjaxCommands.Command
    /**
     * Stores `response.value` as jQuery data under `response.name`.
     */
    data: AjaxCommands.Command
    /**
     * Focuses the first tabbable element inside `response.selector`.
     */
    focusFirst: AjaxCommands.Command
    /**
     * Calls the jQuery method `response.method` with `response.args`.
     */
    invoke: AjaxCommands.Command
    /**
     * Restripes the table matching `response.selector`.
     */
    restripe: AjaxCommands.Command
    /**
     * Replaces the form build ID `response.old` with `response.new`.
     */
    update_build_id: AjaxCommands.Command
    /**
     * Adds the stylesheets in `response.data`.
     */
    add_css: AjaxCommands.Command
    /**
     * Adds `response.message` to the message area.
     */
    message: AjaxCommands.Command
    /**
     * Adds the scripts in `response.data`.
     */
    add_js: AjaxCommands.Command
    /**
     * Scrolls to the element matching `response.selector`.
     */
    scrollTop: AjaxCommands.Command
  }


  type DrupalSettings = {
    path?: {
      baseUrl: string
      pathPrefix: string
      currentPath: string
      currentPathIsAdmin: boolean
      isFront: boolean
      currentLanguage: string
      currentQuery: Record<string, Record<string, string>>
    }
    pluralDelimiter?: string
    suppressDeprecationErrors?: boolean
    ajaxPageState?: {
      libraries: string
      theme: string
      theme_token: string | null
    }
    ajaxTrustedUrl?: Record<string, boolean>
    bigPipePlaceholderIds?: Record<string, any>
    views?: {
      ajax_path?: string
      ajaxViews?: Record<string, {
        view_name: string
        view_display_id: string
        view_args: string
        view_path: string
        view_base_path: string | null
        view_dom_id: string
        pager_element: number
      }>
    }
    domain?: {
      id: string
      name: string
      label: string
    }
    user?: {
      uid: number
      permissionsHash: string
    }
  } & Record<string, any>
  type BehaviorAttach = (
    context: Document | HTMLElement,
    settings: DrupalSettings
  ) => void
  type BehaviorDetach = (
    context: Document | HTMLElement,
    settings: DrupalSettings,
    trigger: 'unload' | 'move' | 'serialize'
  ) => void
  interface Behavior {
    [key: string]: any;
    attach?: BehaviorAttach
    detach?: BehaviorDetach
  }

  export {
    Ajax,
    AjaxCommands,
    AjaxError,
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
    priority?: 'polite' | 'assertive'
    announce?: string
  }
  interface MessageConstructor {
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
    defaultWrapper(): HTMLElement

    /**
     * Provide an object containing the available message types.
     *
     * @return {Object}
     *   An object containing message type strings.
     */
    getMessageTypeLabels(): Record<MessageType, string>


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
    announce(message: string, options: MessageOptions): void
    
    /**
     * Function for creating the internal message wrapper element.
     *
     * @param {HTMLElement} messageWrapper
     *   The message wrapper.
     *
     * @return {HTMLElement}
     *   The internal wrapper DOM element.
     */
    messageInternalWrapper(messageWrapper: HTMLElement): HTMLElement
  }

  interface Message {
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
    add(message: string, options?: MessageOptions): string

    /**
     * Select a message based on id.
     *
     * @name Drupal.Message~messageDefinition.select
     *
     * @param {string} id
     *   The message id to delete from the area.
     *
     * @return {Element|null}
     *   Element found.
     */
    select(id: string): Element | null

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
  }

  export {
    MessageType,
    MessageOptions,
    Message,
    MessageConstructor,
  }
}

declare namespace Drupal.theme {
  // message(): HTMLElement
}

declare namespace Drupal.Ajax {
  /**
   * Settings for the progress indicator.
   */
  interface Progress {
    /**
     * Core provides `'bar'`, `'throbber'` and `'fullscreen'`.
     *
     * @default 'throbber'
     */
    type?: 'bar' | 'throbber' | 'fullscreen' | (string & {})
    /**
     * @default Drupal.t('Processing...')
     */
    message?: string
    /**
     * URL polled for progress updates (bar only).
     */
    url?: string
    /**
     * Polling interval in milliseconds (bar only).
     *
     * @default 1500
     */
    interval?: number
    /**
     * HTTP method of the progress requests (bar only).
     */
    method?: string
    /**
     * The progress element, set while a request is running (jQuery).
     */
    element?: any
    /**
     * The progress bar object, set while a request is running (bar only).
     */
    object?: any
  }

  /**
   * Settings for an Ajax object.
   */
  interface ElementSettings {
    /**
     * Target of the request. Defaults to the link's `href` or the form's
     * `action`.
     */
    url?: string
    /**
     * Event bound to the element that triggers the request.
     *
     * @default 'mousedown' with an element, else null
     */
    event?: string | null
    /**
     * Triggers a request on Enter and Space key presses.
     *
     * @default true
     */
    keypress?: boolean
    /**
     * Selector of the element to bind events to, also used by the commands.
     *
     * @default '#base'
     */
    selector?: string | null
    /**
     * jQuery effect used to show new content.
     *
     * @default 'none'
     */
    effect?: string
    /**
     * Speed of the effect.
     *
     * @default 'none'
     */
    speed?: string | number
    /**
     * jQuery method used to insert new content.
     *
     * @default 'replaceWith'
     */
    method?: string
    /**
     * HTTP method of the request.
     *
     * @default 'POST'
     */
    httpMethod?: string
    /**
     * Progress indicator, or `false` for none.
     */
    progress?: false | Progress
    /**
     * Extra data sent with the request.
     */
    submit?: {
      js?: boolean
      [key: string]: any
    }
    /**
     * Options for `Drupal.dialog`.
     */
    dialog?: object
    /**
     * One of `'modal'` or `'dialog'`.
     */
    dialogType?: string
    dialogRenderer?: string
    /**
     * Element ID to replace (`#ajax['wrapper']`).
     */
    wrapper?: string
    /**
     * Events on which to prevent the default action and stop propagation.
     */
    prevent?: string
    /**
     * Whether the clicked button is sent with the form values.
     */
    setClick?: boolean
    [key: string]: any
  }

  /**
   * Settings for {@link Drupal.ajax}.
   */
  interface Settings extends ElementSettings {
    /**
     * Passed as `base` to the {@link Drupal.Ajax} constructor.
     */
    base?: string
    /**
     * Passed as `element` to the {@link Drupal.Ajax} constructor.
     */
    element?: HTMLElement
  }

  /**
   * Options passed to `jQuery.ajax()`.
   */
  interface Options {
    url: string
    data: Record<string, any>
    dataType: string
    jsonp: boolean
    method: string
    [key: string]: any
  }

  /**
   * Effect returned by `Drupal.Ajax#getEffect()`.
   */
  interface Effect {
    showEffect: string
    hideEffect: string
    showSpeed: string | number
  }

  export { Effect, ElementSettings, Options, Progress, Settings }
}

declare namespace Drupal.AjaxCommands {
  /**
   * A command of an Ajax response.
   */
  interface Response {
    command: string
    [key: string]: any
  }

  /**
   * An Ajax command. Core commands return nothing, `add_css` and `add_js`
   * return a promise that resolves once the assets are loaded.
   */
  type Command = (
    ajax: Drupal.Ajax | undefined,
    response: Response,
    status?: number | string
  ) => void | Promise<void>

  export { Command, Response }
}
