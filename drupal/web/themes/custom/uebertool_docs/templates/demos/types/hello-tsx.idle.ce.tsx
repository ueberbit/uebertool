import { render } from 'preact'

/**
 * A custom element that renders JSX with Preact.
 *
 * @element demo-hello-tsx
 *
 * @attr {string} name - Who to greet.
 */
export class HelloTsx extends HTMLElement {
  connectedCallback() {
    const name = this.getAttribute('name') ?? 'Somebody'

    render(
      <p>
        Hello,
        {' '}
        <strong>{name}</strong>
        ! (tsx)
      </p>,
      this,
    )
  }

  disconnectedCallback() {
    render(null, this)
  }
}
