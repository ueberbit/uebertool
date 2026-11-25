import type { PluginOption } from 'vite'
import type { Context, UserOptions } from './plugins/context'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import Unimport from 'unimport/unplugin'
import Components from 'unplugin-vue-components/vite'
import breakpoints from './plugins/breakpoints'
import config from './plugins/config'
import context from './plugins/context'
import css from './plugins/css'
import vuePlugin from './plugins/custom-elements'
import devtools from './plugins/devtools'
import libraries from './plugins/libraries'
import restart from './plugins/restart'
import tailwindHMR from './plugins/tailwind-hmr'
import takeover from './plugins/takeover'
import themeInfo from './plugins/theme'
import translations from './plugins/translations'
import twig from './plugins/twig'
import virtual from './plugins/virtual'
import vueCustomElement from './plugins/vue-custom-element'
// import copyStatic from './plugins/copy-static'

export type { Context, Options, UserOptions } from './plugins/context'
export type { CSSGroup, CSSPart, DrupalLibrary, JSPart } from './plugins/libraries'

export default (options: UserOptions = {}): PluginOption[] => {
  const ctx = <Context>{}

  const UnimportPlugin = 'default' in Unimport
    ? Unimport.default as typeof Unimport
    : Unimport

  return [
    context(ctx, options),
    config(ctx),
    // copyStatic(ctx),
    css(ctx),
    libraries(ctx),
    themeInfo(ctx),
    translations(ctx),
    tailwindHMR(),
    vueCustomElement(),
    breakpoints(ctx),
    twig(ctx),
    tailwindcss(),
    virtual(ctx),
    vue(ctx.options.vue),
    vuePlugin(ctx),
    restart(ctx),
    takeover(ctx),
    UnimportPlugin.vite(ctx.options.unimport || {}),
    Components(ctx.options.components),
    devtools(ctx),
  ].flat()
}
