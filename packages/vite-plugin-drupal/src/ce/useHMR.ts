import { onUpdated } from 'vue'
import { refreshTailwindSheet } from './styles'

/**
 * Re-read the Tailwind stylesheet when the component updates, so new utility
 * classes show up inside the shadow DOM during development. Refreshes are
 * coalesced to one per animation frame.
 */
export function useHMR() {
  onUpdated(refreshTailwindSheet)
}
