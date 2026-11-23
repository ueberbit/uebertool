/**
 * Custom elements can be written in .tsx as well.
 *
 * @element demo-hello-tsx
 *
 * @attr {string} name - Who to greet.
 */
export class HelloTsx extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `<p>Hello, <strong>${this.getAttribute('name') ?? 'Somebody'}</strong>! (tsx)</p>`
  }
}
