/**
 * A vanilla custom element.
 *
 * @element demo-hello-vanilla
 *
 * @attr {string} name - Who to greet.
 */
export class HelloVanilla extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `<p>Hello, <strong>${this.getAttribute('name') ?? 'Somebody'}</strong>! (vanilla)</p>`
  }
}
