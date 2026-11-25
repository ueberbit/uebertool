import type { ViteDevToolsNodeContext } from '@vitejs/devtools-kit'
import type { PickResult, PickTarget } from '../../types'
import { join, relative, resolve } from 'node:path'
import { buildComponentIndex, exists, findHostRoot } from '../../utils'
import { getDrupalPickerState } from '../context'

/** The source file behind a picked marker, or `null` when nothing matches it. */
async function locate(context: ViteDevToolsNodeContext, target: PickTarget): Promise<string | null> {
  const state = getDrupalPickerState(context)
  const { appRoot } = state.options

  if (target.kind === 'template') {
    const path = resolve(appRoot, target.id)
    return await exists(path)
      ? path
      : null
  }

  state.components ??= await buildComponentIndex(appRoot)
  // A component added since the last scan misses; rebuild once before giving up
  // so the picker keeps working without a server restart.
  if (!state.components.has(target.id))
    state.components = await buildComponentIndex(appRoot)

  return state.components.get(target.id) ?? null
}

export const pickerOpen = {
  name: 'drupal-picker:open',
  type: 'action',
  jsonSerializable: true,
  // `@vitejs/devtools-kit@0.4.9` types `rpc.register` against the framework-
  // neutral node context while `defineRpcFunction` types this hook against the
  // Vite-flavoured one, so the two do not line up. Written as a plain
  // definition and narrowed here, which is the same object either way.
  setup: (rpcContext: unknown) => {
    const context = rpcContext as ViteDevToolsNodeContext

    return {
      handler: async (target: PickTarget): Promise<PickResult | null> => {
        const path = await locate(context, target)
        if (!path) {
          context.messages.add({
            level: 'warn',
            message: `No source file for ${target.id}`,
            description: target.kind === 'component'
              ? 'The component is not declared by any extension under the Drupal root.'
              : 'The template path from the theme debug comment does not exist on disk.',
            notify: true,
          })
          return null
        }

        const state = getDrupalPickerState(context)
        const rel = relative(context.workspaceRoot, path)

        if (state.options.inContainer) {
          state.hostRoot ??= state.options.hostRoot
            ?? await findHostRoot(context.workspaceRoot)
            ?? context.workspaceRoot
          return {
            path: rel,
            url: state.options.editorUrl.replace('{path}', join(state.hostRoot, rel)),
          }
        }

        // `vite:core:open-in-editor` is a built-in public RPC; it resolves
        // against the workspace root and launches $EDITOR.
        await (context.rpc.invokeLocal as (name: string, ...args: unknown[]) => Promise<unknown>)(
          'vite:core:open-in-editor',
          rel,
        )
        return { path: rel }
      },
    }
  },
}
