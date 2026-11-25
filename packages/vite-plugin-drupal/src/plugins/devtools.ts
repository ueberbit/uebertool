import type { PluginWithDevTools } from '@vitejs/devtools-kit'
import type { PluginOption } from 'vite'
import type { Context } from './context'
import { A11yCheckerPlugin, DevTools, DrupalPickerPlugin } from '../devtools'
import { AbsoluteUrlsPlugin } from '../devtools/absolute-urls'
import { getSiteOrigins } from './config'

/** Where Vite serves {@link LOADER}, the dock's entry on Drupal pages. */
export const DEVTOOLS_LOADER_PATH = '/__uebertool/devtools.js'

/**
 * Loads the dock on a Drupal page. `embedded.js` first fetches its connection
 * meta root-relative, which the browser resolves against Drupal (a 404 on every
 * page), and only then from the Vite URL. Handing it the meta up front skips
 * both lookups. `__DEVFRAME_CONNECTION_META__` is the global `@devframes/hub-ui`
 * checks before fetching, with `baseUrl` set to what a fetch would have used.
 */
const LOADER = `const meta = new URL('/__devtools/__connection.json', import.meta.url)
try {
  const response = await fetch(meta)
  if (response.ok)
    globalThis.__DEVFRAME_CONNECTION_META__ = { ...await response.json(), baseUrl: meta.href }
}
catch {}
await import(new URL('/__devtools/embedded.js', import.meta.url).href)
`

/**
 * Vite DevTools on Drupal pages. The dock is loaded by the `vite` library (see
 * libraries.ts) on the Drupal origin, while the hub, its assets and its panels
 * live on the Vite URL.
 */
export default (ctx: Context): PluginOption[] => {
  if (!ctx.options.devtools)
    return []

  // The Vite URL is only known in the `config` hook. DevTools reads these
  // objects when the hub starts, so they are filled in there.
  const allowedOrigins: string[] = []
  const branding: Record<string, unknown> = {}

  return [
    DevTools({
      // The panels run in iframes on the Vite URL, where the one-time-code
      // auth of the Drupal page does not reach. Only the Drupal site and Vite
      // may connect instead.
      clientAuth: false,
      allowedOrigins,
      branding,
    }),
    {
      name: 'vite-plugin-uebertool-devtools',
      config() {
        allowedOrigins.push(ctx.url, ...getSiteOrigins(ctx))
        // The default branding points root-relative at the hub assets.
        const asset = (file: string) => `${ctx.url}/__devtools-assets/${file}`
        Object.assign(branding, {
          logo: asset('vite-plus.svg'),
          favicon: asset('vite-plus.svg'),
          wordmark: {
            light: asset('vite-devtools-kit-light.svg'),
            dark: asset('vite-devtools-kit-dark.svg'),
          },
        })
      },
      configureServer(server) {
        // Runs ahead of Vite's own CORS middleware, so the Drupal page gets its
        // header here, and only the origins allowed to connect anyway.
        server.middlewares.use(DEVTOOLS_LOADER_PATH, (req, res) => {
          const origin = req.headers.origin
          if (origin && allowedOrigins.includes(origin)) {
            res.setHeader('Access-Control-Allow-Origin', origin)
            res.setHeader('Vary', 'Origin')
          }
          res.setHeader('Content-Type', 'text/javascript')
          res.setHeader('Cache-Control', 'no-cache')
          res.end(LOADER)
        })
      },
    },
    A11yCheckerPlugin(),
    DrupalPickerPlugin(ctx.options.devtools.picker),
    AbsoluteUrlsPlugin(() => ctx.url),
    HideFrameworkCategory(),
  ]
}

/** Marks settings the default has been applied to, so a user's choice sticks. */
const DEFAULTS_APPLIED = 'uebertoolDefaultsApplied'

/**
 * Hides the dock's Framework category (the Vite+ group) by default. The
 * DevTools user settings are persisted by the hub, so the default is applied
 * once and can be switched back on in the dock settings.
 */
function HideFrameworkCategory(): PluginWithDevTools {
  return {
    name: 'vite-plugin-uebertool-devtools-defaults',
    apply: 'serve',
    devtools: {
      async setup(context) {
        const settings = await context.rpc.sharedState.get<{
          docksCategoriesHidden: string[]
          [DEFAULTS_APPLIED]?: boolean
        }>('devframe:user-settings')
        if (settings.value()[DEFAULTS_APPLIED])
          return
        settings.mutate((state) => {
          if (!state.docksCategoriesHidden.includes('framework'))
            state.docksCategoriesHidden.push('framework')
          state[DEFAULTS_APPLIED] = true
        })
      },
    },
  }
}
