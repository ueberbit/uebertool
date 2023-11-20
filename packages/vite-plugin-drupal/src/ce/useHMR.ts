import { getCurrentInstance, onUpdated } from 'vue'
import { adoptStyles } from './styles'

export function useHMR() {
  onUpdated(() => {
    const shadowRoot = getCurrentInstance()?.vnode?.el?.getRootNode()
    const styles = Array.from((document.querySelectorAll('link[href*="tailwind"]')[0] as HTMLStyleElement).sheet?.cssRules || []).reduce((acc, curr: any) => acc + curr.cssText, '')

    styles && adoptStyles(shadowRoot, [styles], 'tailwind')
  })
}

// without setup:
// updated() {
//   const styles = Array.from(document.querySelectorAll('style')).find(el => el.innerHTML.includes('tailwind'))?.textContent
//       styles && adoptStyles(this.$.shadowRoot, [styles], 'tailwind')
// }
