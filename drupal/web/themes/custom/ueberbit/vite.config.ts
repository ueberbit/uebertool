import { createLogger, defineConfig } from 'vite'
// import uebertool from '@ueberbit/vite-plugin-drupal'
import uebertool from '../../../../../packages/vite-plugin-drupal/src/index'
// import fg from 'fast-glob'
// import hmr from './hmr-plugin'

// const docs = {
//   name: 'vue-docs',
//   transform(_, id) {
//     if (!/vue&type=docs/.test(id)) {
//       return
//     }
//     return `export default {}`
//   },
// }

// const logger = createLogger()

// logger.warn = (msg, options) => {
//   if (msg.includes('Duplicated imports'))
//     return
//   logger.warn(msg, options)
// }

// logger.info = (msg, options) => {
//   if (msg.includes('Duplicated imports'))
//     return
//   logger.info(msg, options)
// }

// function examplePlugin() {
//   return {
//     name: 'example',

//     // configResolved(resolvedConfig) {
//     //   // store the resolved config
//     //   // console.log(resolvedConfig.css.postcss)
//     // },
//     configureServer(server) {
//       server.watcher.on('add', (file) => {
//         console.log('File added:', file)
//       })
//     },
//   }
// }

// const input = fg.sync([
//   '(js|css|templates)/**/*.css',
//   'components/**/(assets|src|js|css)/*.css',
// ])

export default defineConfig({
  // logLevel: 'error',
  // customLogger: logger,
  server: {
    // origin: 'https://uebertool.localhost',
    // host: 'uebertool.localhost',
    port: 5174,
  },
  build: {
    rollupOptions: {
      input: [

      ],
    },
  },
  plugins: [
    uebertool({
      // url: 'https://uebertool.localhost',
      breakpoints: {
        multipliers: ['3x'],
      },
    }),
    {
      name: 'example',
      configResolved(resolvedConfig) {
        // console.log(JSON.stringify(resolvedConfig.build.rollupOptions.input))
      },
    },
    // examplePlugin(),
    // docs,
    // hmr(),
  ],
})
