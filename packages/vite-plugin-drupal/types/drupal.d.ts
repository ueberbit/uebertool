/// <reference types="@types/js-cookie" />

export {}
declare global {
  const Drupal: Drupal
  const drupalSettings: Drupal.DrupalSettings
  const once: <T extends Element>(id: string, selector, context?: Document | Element) => T[]
  const Cookies: Cookies.CookiesStatic & {
    noConflict?(): Cookies.CookiesStatic;
  }

  interface Window {
    Drupal: Drupal
    drupalSettings: Drupal.DrupalSettings
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
    attachBehaviors: (
      context: Document | HTMLElement | Element,
      settings: Drupal.DrupalSettings
    ) => void
    behaviors: Record<string, Drupal.Behavior>
    checkPlain: (str: string) => string
    debounce: (func: Function, wait: number, immediate: boolean) => Function
    detachBehaviors: (
      context?: Document | HTMLElement | Element,
      settings?: object,
      trigger?: string
    ) => void
    encodePath: (item: string) => string
    formatPlural: (
      count: number,
      singular: string,
      plural: string,
      argsopt?: object,
      optionsopt?: object
    ) => string
    formatString: (str: string, args: object) => string
    stringReplace: (
      str: string,
      args: object,
      keys: Array<any> | null
    ) => string
    t: (
      str: string,
      args?: Record<string, string>,
      options?: { context?: string }
    ) => string
    throwError: (error: Error | string) => void
    url: (path: string) => string
    // Message
  }
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
