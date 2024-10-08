import type { Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import Icons from 'unplugin-icons/vite'
import Unimport from 'unimport/unplugin'
import Components from 'unplugin-vue-components/vite'
import context from './plugins/context'
import type { Context, UserOptions } from './plugins/context'
import config from './plugins/config'
import css from './plugins/css'
import libraries from './plugins/libraries'
import themeInfo from './plugins/theme'
import twig from './plugins/twig'
import virtual from './plugins/virtual'
import vuePlugin from './plugins/custom-elements'
import breakpoints from './plugins/breakpoints'
import tailwindHMR from './plugins/tailwind-hmr'
import tailwindConfig from './plugins/tailwind-config'
import vueCustomElement from './plugins/vue-custom-element'
import restart from './plugins/restart'
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
    tailwindHMR(),
    tailwindConfig(ctx),
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
