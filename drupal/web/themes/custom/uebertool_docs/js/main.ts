/**
 * Global entrypoint. `Alpine` is auto-imported, `Drupal` is a global.
 */
Alpine.store('darkMode', {
  on: false,
  toggle() {
    this.on = !this.on
  },
})

Alpine.start()

export {}
