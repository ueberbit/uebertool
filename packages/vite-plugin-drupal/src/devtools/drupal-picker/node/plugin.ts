/// <reference types="@vitejs/devtools-kit" />
import type { PluginWithDevTools } from '@vitejs/devtools-kit'
import type { DrupalPickerOptions, DrupalPickerResolvedOptions } from './types'
import process from 'node:process'
import { normalize } from 'pathe'
import { DEFAULT_EDITOR_URL } from './constants'
import { rpcFunctions } from './rpc'
import { setDrupalPickerOptions } from './rpc/context'
import { findAppRoot, resolveClientScript } from './utils'

export { DEFAULT_EDITOR_URL } from './constants'

/**
 * Adds a Vite DevTools action entry that highlights the SDC components and
 * Twig templates on the page and opens the picked one in the editor.
 *
 * The picked file is opened by launching `$EDITOR` where Vite runs, except
 * inside the ddev web container, where the browser opens
 * {@link DrupalPickerOptions.editorUrl} instead — see `findHostRoot`.
 *
 * Both marker kinds only exist while Twig debug is on
 * (`parameters.twig.config.debug: true` in `services.yml`), so the picker finds
 * nothing on a production-mode render.
 */
export function DrupalPickerPlugin(options: DrupalPickerOptions = {}): PluginWithDevTools {
  return {
    name: 'drupal-picker-devtools',
    apply: 'serve',

    devtools: {
      setup(context) {
        const clientScript = resolveClientScript()
        if (!clientScript) {
          throw new Error('[drupal-picker] Client script not found, did you build the plugin?')
        }

        // Vite is started from the theme directory, but the theme debug
        // comments name paths relative to Drupal's app root.
        const appRoot = findAppRoot(context.viteConfig.root)
        if (!appRoot) {
          throw new Error(
            `[drupal-picker] No Drupal app root above ${context.viteConfig.root}`,
          )
        }

        const resolvedOptions: DrupalPickerResolvedOptions = {
          editorUrl: options.editorUrl ?? DEFAULT_EDITOR_URL,
          hostRoot: options.hostRoot,
          appRoot,
          inContainer: process.env.IS_DDEV_PROJECT === 'true',
        }
        setDrupalPickerOptions(context, resolvedOptions)

        for (const fn of rpcFunctions)
          context.rpc.register(fn)

        context.docks.register({
          type: 'action',
          id: 'drupal-picker',
          title: 'Drupal Picker',
          category: 'drupal',
          icon: 'ph:crosshair-duotone',
          action: {
            // The dock builds `import('<importFrom>')` into a virtual module it
            // serves to the page, so the specifier has to resolve through Vite
            // rather than through a package export.
            importFrom: `/@fs/${normalize(clientScript)}`,
          },
        })
      },
    },
  }
}
