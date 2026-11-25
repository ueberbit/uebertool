import type { ViteDevToolsNodeContext } from '@vitejs/devtools-kit'
import type { DrupalPickerResolvedOptions } from '../types'

export interface DrupalPickerState {
  options: DrupalPickerResolvedOptions
  /** Built on first pick, rebuilt when a lookup misses. */
  components: Map<string, string> | null
  /** Resolved once per server run. */
  hostRoot?: string
}

const states = new WeakMap<ViteDevToolsNodeContext, DrupalPickerState>()

export function setDrupalPickerOptions(
  context: ViteDevToolsNodeContext,
  options: DrupalPickerResolvedOptions,
): void {
  states.set(context, { options, components: null })
}

export function getDrupalPickerState(context: ViteDevToolsNodeContext): DrupalPickerState {
  const state = states.get(context)
  if (!state) {
    throw new Error('[drupal-picker] Missing plugin options in context. Ensure setup calls setDrupalPickerOptions(context, options) before registering RPC functions.')
  }
  return state
}
