import type { Plugin, ProxyOptions } from 'vite'
import type { Context } from './context'
import process from 'node:process'
import { getSiteOrigins } from './config'

/**
 * Lets you browse the Drupal site through the dev server, e.g.
 * `https://site:5173/`. Vite answers its own URLs (the theme, `/@vite/…`,
 * `/__…`, `node_modules`) and the CSS of drupal-css.ts. Everything else goes to
 * Drupal.
 *
 * In DDEV, Drupal's web server runs in the same container and accepts any
 * host, so requests keep the Host header of the dev server and Drupal builds
 * its URLs for it. Elsewhere requests get the Host of the Drupal site, so its
 * web server finds the site. Redirects are rewritten to the dev server, other
 * absolute URLs only if Drupal trusts the X-Forwarded-* headers
 * (`reverse_proxy` in settings.php).
 */
export default (ctx: Context): Plugin => {
  const escape = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

  return {
    name: 'vite-plugin-uebertool-proxy',
    apply: 'serve',
    config(config) {
      if (ctx.options.proxy === false)
        return

      const ddev = !ctx.options.proxy && !!process.env.IS_DDEV_PROJECT
      const target = ctx.options.proxy || (ddev
        ? 'http://127.0.0.1'
        : getSiteOrigins(ctx)[0]) || 'http://localhost'
      const options: ProxyOptions = ddev
        ? {
            target,
            // Keep the Host header: Drupal builds absolute URLs from it.
            changeOrigin: false,
          }
        : {
            target,
            changeOrigin: true,
            // Local sites often use self-signed certificates.
            secure: false,
            xfwd: true,
            configure(proxy) {
              proxy.on('proxyReq', (proxyReq, req) => {
                if (req.headers.host)
                  proxyReq.setHeader('X-Forwarded-Host', req.headers.host)
              })
              // Redirects to the site point to the dev server, with the protocol
              // the browser used (a TLS proxy in front of Vite sets it).
              proxy.on('proxyRes', (proxyRes, req) => {
                const location = proxyRes.headers.location
                if (!location || !req.headers.host)
                  return
                const url = new URL(location, target)
                if (url.hostname !== new URL(target).hostname)
                  return
                const proto = String(req.headers['x-forwarded-proto'] ?? '').split(',')[0]
                  || (config.server?.https ? 'https' : 'http')
                proxyRes.headers.location = `${proto}://${req.headers.host}${url.pathname}${url.search}${url.hash}`
              })
            },
          }

      return {
        server: {
          proxy: {
            [`^/(?!@|__|node_modules/|${escape(ctx.themeBasePath.slice(1))}/)`]: options,
          },
        },
      }
    },
    configureServer(server) {
      if (ctx.options.proxy === false)
        return

      // Print the site URL instead of the container's hosts and the theme base.
      const printUrls = server.printUrls
      server.printUrls = () => {
        server.resolvedUrls = {
          local: [`${ctx.url}/`],
          network: [],
        }
        printUrls()
      }
    },
  }
}
