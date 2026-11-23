import styles from './Details.css?inline'

/**
 * Details show a brief summary and expand to show additional content..
 *
 * @slot - The details' main content.
 * @slot summary - The details' summary. Alternatively, you can use the `summary` attribute.
 *
 * @event ue-show - Emitted when the details opens.
 * @event ue-after-show - Emitted after the details opens and all animations are complete.
 * @event ue-hide - Emitted when the details closes.
 * @event ue-after-hide - Emitted after the details closes and all animations are complete.
 *
 * @csspart base - The component’s base wrapper.
 * @csspart summary - The header that wraps both the summary and the expand/collapse icon.
 * @csspart body - The component’s content wrapper.
 * @csspart content - The details content.
 */
@customElement('ue-details')
export class UEDetails extends UElement {
  @query('header')
  header!: HTMLElement

  /**
   * If the details is open or closed.
   */
  @property({ type: Boolean, reflect: true }) open = false

  /**
   * Disables the details so it can’t be toggled.
   */
  @property({ type: Boolean, reflect: true }) disabled = false

  /**
   * The summary to show in the header. If you need to display HTML, use the summary slot instead.
   */
  @property() summary = ''

  private abortController!: AbortController

  static styles = unsafeCSS(styles)

  @watch('open', { waitUntilFirstUpdate: true })
  async handleOpenChange() {
    this.abortController?.abort()
    this.abortController = new AbortController()
    if (this.open) {
      this.emit('ue-show', { cancelable: true })
      await waitForEvent(this.header, 'transitionend', {
        signal: this.abortController.signal,
      })
      this.emit('ue-after-show')
    }

    else {
      this.emit('ue-hide', { cancelable: true })
      await waitForEvent(this.header, 'transitionend', {
        signal: this.abortController.signal,
      })
      this.emit('ue-after-hide')
    }
  }

  async show() {
    this.open = true
    this.header.focus()
    return waitForEvent(this, 'ue-after-show')
  }

  async hide() {
    this.open = false
    return waitForEvent(this, 'ue-after-hide')
  }

  private _handleSummaryClick(e: MouseEvent) {
    e.preventDefault()
    if (!this.disabled)
      this.open ? this.hide() : this.show()
  }

  private _handleSummaryKeyUp(e: KeyboardEvent) {
    if (!this.disabled && ['Space', 'Enter'].includes(e.code)) {
      e.preventDefault()
      this.open ? this.hide() : this.show()
    }
  }

  render() {
    return html`
      <div part="base">
        <header
          aria-controls="content"
          aria-expanded="${this.open}"
          part="summary"
          tabindex="0"
          role="button"
          @click="${this._handleSummaryClick}"
          @keydown="${this._handleSummaryKeyUp}"
          >
          <slot name="summary">${this.summary}</slot>
        </header>
        <div part="body">
          <div part="content" id="content">
            <slot></slot>
          </div>
        </div>
      </div>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ue-details': UEDetails
  }
}
