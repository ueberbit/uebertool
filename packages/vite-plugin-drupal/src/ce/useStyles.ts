import { getCurrentInstance, onMounted } from 'vue'
import { adoptStyles } from './styles'

/**
 * Mounting normal vue components inside a vue custom elements discards the css.
 * To fix this the styles are applied to the renderRoot.
 */
export function useStyles() {
  onMounted(() => {
    const instance = getCurrentInstance()

    if (!instance)
      return

    // Inside a Vue custom element Vue injects the styles of the element and
    // of nested *.ce.vue components itself (`ce` is internal, hence the cast).
    const ce = (i: typeof instance | null) => (i as { ce?: unknown } | null)?.ce
    if (ce(instance) || ce(instance.root))
      return

    const renderRoot = instance.vnode?.el?.getRootNode()
    if (!renderRoot)
      return

    // `styles` and `__hmrId` are set on the component by @vitejs/plugin-vue.
    const type = instance.type as { styles?: string[], __hmrId?: string }
    if (!type.styles)
      return

    const styles = type.styles.join('')

    // Use __hmrId as UUID for replacing styles, instead of adding new ones every time.
    const __hmrId = type.__hmrId

    /**
     * If the rootNode of the element is a shadowRoot, attach the styles.
     * Otherwise vue will handle it normally.
     */
    if (renderRoot instanceof ShadowRoot)
      adoptStyles(renderRoot as ShadowRoot, [styles], __hmrId)
  })
}
