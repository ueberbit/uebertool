/**
 * Translatable strings in a lazily loaded custom element.
 *
 * @element demo-translated-cart
 *
 * @attr {number} count - Number of items in the cart.
 */
export class TranslatedCart extends HTMLElement {
  connectedCallback() {
    const count = Number(this.getAttribute('count') ?? 0)

    // Plain string.
    const title = Drupal.t('Your cart')
    // Placeholders: @ escapes, % escapes and emphasizes.
    const greeting = Drupal.t('Welcome back, @name!', { '@name': 'Drupal' })
    // Context, for words with several meanings.
    const order = Drupal.t('Order', {}, { context: 'Sort' })
    // Singular and plural, @count is filled in.
    const items = Drupal.formatPlural(count, '1 item', '@count items')

    this.innerHTML = `
      <h3>${title}</h3>
      <p>${greeting}</p>
      <p>${items} · ${order}</p>
    `
  }
}
