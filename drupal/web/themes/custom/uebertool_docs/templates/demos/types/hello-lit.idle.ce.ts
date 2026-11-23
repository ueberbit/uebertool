import { css, html, LitElement } from 'lit'

/**
 * A Lit element.
 *
 * @element demo-hello-lit
 *
 * @attr {string} name - Who to greet.
 * @slot - Appended after the greeting.
 */
export class HelloLit extends LitElement {
  static properties = {
    name: { type: String },
  }

  static styles = css`p { color: #2563eb; margin: 0 }`

  declare name: string

  constructor() {
    super()
    this.name = 'Somebody'
  }

  render() {
    return html`<p>Hello, <strong>${this.name}</strong>! (lit) <slot></slot></p>`
  }
}
