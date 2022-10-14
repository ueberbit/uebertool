import { getCurrentInstance, onMounted, ref } from 'vue'
import { adoptStyles } from './styles'

/**
 * Mounting normal vue components inside a vue custom elements discards the css.
 * To fix this the styles are applied to the renderRoot.
 */
export const useStyles = () => {
  const renderRoot = ref<ShadowRoot | Document>()

  onMounted(() => {
    const instance = getCurrentInstance()
    if (!instance)
      return

    renderRoot.value = instance.vnode?.el?.getRootNode()
    if (!renderRoot.value)
      return

    // @ts-expect-error custom api
    if (!instance.type.styles)
      return

    // @ts-expect-error custom api
    const styles = instance.type.styles.join('')

    // Use __hmrId as UUID for replacing styles, instead of adding new ones every time.
    // @ts-expect-error custom api
    const __hmrId = instance.type.__hmrId

    /**
     * If the rootNode of the element is a shadowRoot, attach the styles.
     * Otherwise vue will handle it normally.
     */
    if (renderRoot.value instanceof ShadowRoot)
      adoptStyles(renderRoot.value as ShadowRoot, [styles], __hmrId)
  })
}
