import type { Plugin } from 'vite'
import type { Context, UserOptions } from './plugins/context'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import Unimport from 'unimport/unplugin'
import Icons from 'unplugin-icons/vite'
import Components from 'unplugin-vue-components/vite'
import breakpoints from './plugins/breakpoints'
import config from './plugins/config'
import context from './plugins/context'
import css from './plugins/css'
import vuePlugin from './plugins/custom-elements'
import libraries from './plugins/libraries'
import restart from './plugins/restart'
import tailwindHMR from './plugins/tailwind-hmr'
import themeInfo from './plugins/theme'
import twig from './plugins/twig'
import virtual from './plugins/virtual'
import vueCustomElement from './plugins/vue-custom-element'
// import copyStatic from './plugins/copy-static'

export default (options: UserOptions = {}): Plugin[] => {
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
    tailwindcss(),
    tailwindHMR(),
    // tailwindConfig(ctx),
    vueCustomElement(),
    breakpoints(ctx),
    twig(ctx),
    virtual(ctx),
    vue(ctx.options.vue),
    vuePlugin(ctx),
    Icons(ctx.options.icons || {}),
    restart(ctx),
    UnimportPlugin.vite(ctx.options.unimport || {}),
    Components(ctx.options.components),
  ].flat()
}
