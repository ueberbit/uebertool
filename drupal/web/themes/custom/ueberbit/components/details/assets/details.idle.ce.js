/**
 * Details show a brief summary and expand to show additional content.
 *
 * @element ww-details
 *
 * @slot - The details' main content.
 * @slot summary - The details' summary. Alternatively, you can use the `summary` attribute.
 *
 * @csspart base - The component’s base wrapper.
 * @csspart summary - The header that wraps both the summary and the expand/collapse icon.
 * @csspart body - The component’s content wrapper.
 * @csspart content - The details content.
 */
export default class Details extends HTMLElement {
  #first = true
  #header = null

  get open() {
    return this.hasAttribute('open')
  }

  set open(value) {
    this.toggleAttribute('open', value)
  }

  get disabled() {
    return this.hasAttribute('disabled')
  }

  set disabled(value) {
    this.toggleAttribute('disabled', value)
  }

  connectedCallback() {
    this.#first && this.firstUpdated()
  }

  disconnectedCallback() {
    this.removeEventListener('click', this.handleClick)
    this.removeEventListener('keyup', this.handleKeyUp)
    this.removeEventListener('keydown', this.handleKeyDown)
  }

  firstUpdated() {
    this.#first = false
    this.#header = this.shadowRoot?.querySelector('header')

    if (this.#header) {
      this.#header.addEventListener('click', this.handleClick.bind(this))
      this.#header.addEventListener('keyup', this.handleKeyUp.bind(this))
      this.#header.addEventListener('keydown', this.handleKeyDown.bind(this))
    }

    this.hasAttribute('name') && (this.siblings = this.parentElement.children)
  }

  hide() {
    this.open = false
    this.#header?.setAttribute('aria-expanded', 'false')
    this.dispatchEvent(new CustomEvent('ww-hide'))
  }

  show() {
    this.open = true
    this.#header?.setAttribute('aria-expanded', 'true')
    this.dispatchEvent(new CustomEvent('ww-show'))
    this.hasAttribute('name') && Array.from(this.siblings).forEach((sibling) => {
      sibling !== this && sibling.hide()
    })
  }

  handleClick() {
    if (this.disabled)
      return
    this.open
      ? this.hide()
      : this.show()
  }

  handleKeyUp(e) {
    if (!this.disabled && ['Space', 'Enter'].includes(e.code)) {
      e.preventDefault()
      this.open
        ? this.hide()
        : this.show()
    }
  }

  handleKeyDown(e) {
    if (!this.disabled && ['Space', 'Enter'].includes(e.code))
      e.preventDefault()
  }
}
// customElements.define('ww-details', Details)
