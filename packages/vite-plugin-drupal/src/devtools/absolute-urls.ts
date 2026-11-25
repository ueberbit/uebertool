/// <reference types="@vitejs/devtools-kit" />
import type { DevToolsDockEntryIcon, DevToolsDockUserEntry, PluginWithDevTools } from '@vitejs/devtools-kit'

/**
 * Dock entries reference hub assets and views root-relative
 * (`/__devtools-assets/vite.svg`). On a Drupal page the browser resolves them
 * against Drupal instead of Vite, so prefix them with the Vite origin.
 */
export function AbsoluteUrlsPlugin(origin: () => string): PluginWithDevTools {
  return {
    name: 'uebertool-devtools-absolute-urls',
    apply: 'serve',
    devtools: {
      setup(context) {
        const absolute = (url: string) => url.startsWith('/') && !url.startsWith('//')
          ? `${origin()}${url}`
          : url
        const absoluteIcon = (icon: DevToolsDockEntryIcon) => typeof icon === 'string'
          ? absolute(icon)
          : {
              light: absolute(icon.light),
              dark: absolute(icon.dark),
            }

        const rewrite = (entry: DevToolsDockUserEntry) => {
          const patched = {
            ...entry,
            ...('icon' in entry && entry.icon && {
              icon: absoluteIcon(entry.icon),
            }),
            ...(entry.type === 'iframe' && {
              url: absolute(entry.url),
            }),
          } as DevToolsDockUserEntry
          // The update emits `docks:entry:updated` again, then nothing changes.
          if (JSON.stringify(patched) !== JSON.stringify(entry))
            context.docks.update(patched)
        }

        // Entries registered before this setup ran, and every later change.
        context.docks.views.forEach(rewrite)
        context.docks.events.on('docks:entry:updated', rewrite)
      },
    },
  }
}
