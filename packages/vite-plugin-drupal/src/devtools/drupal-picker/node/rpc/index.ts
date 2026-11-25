import { pickerOpen } from './functions/open'

export const rpcFunctions = [
  pickerOpen,
] as const

// The examples pair this with a `DevToolsRpcServerFunctions` augmentation built
// from `RpcDefinitionsToFunctions`. It is omitted deliberately: in 0.4.9 the kit
// only *re-exports* that interface from `@devframes/hub/types`, so augmenting
// `@vitejs/devtools-kit` declares a fresh interface instead of merging into the
// one `rpc.call` / `invokeLocal` are typed against — and neither `devframe` nor
// `@devframes/hub` is resolvable from this project under pnpm's strict layout.
// Both call sites are narrowed locally instead; see `functions/open.ts` and
// `client/pick.ts`.
