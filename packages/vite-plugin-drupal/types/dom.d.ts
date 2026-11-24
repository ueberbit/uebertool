declare global {
  interface Window {
    Drupal: Drupal
    customElementLoader?: { load: (context: Document | Element) => unknown }
  }
}

export {}
