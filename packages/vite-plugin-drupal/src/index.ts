import type { Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import Icons from 'unplugin-icons/vite'
import context, { createContext } from './plugins/context'
import type { UserOptions } from './plugins/context'
import config from './plugins/config'
import css from './plugins/css'
import libraries from './plugins/libraries'
import themeInfo from './plugins/theme'
import vuePlugin from './plugins/custom-elements'
import breakpoints from './plugins/breakpoints'
import twhmr from './plugins/vite-plugin-twhmr'

export default (options: UserOptions = {}): Plugin[] => {
  const ctx = createContext(options)

  return [
    context(ctx),
    config(ctx),
    css(ctx),
    libraries(ctx),
    themeInfo(ctx),
    twhmr(),
    breakpoints(ctx),
    vue(ctx.options.vue),
    vuePlugin(ctx),
    Icons(ctx.options.icons || {}),
  ].flat()
}
