import fse from 'fs-extra'
import type { Plugin } from 'vite'
import type { Context } from './context'

export default (ctx: Context): Plugin => {
  return {
    name: 'vite-plugin-uebertool-bootstrap',
    enforce: 'pre',
    buildStart() {
      generateViteEnv()
      generateTsConfig()
    },
  }
}

function generateViteEnv() {
  fse.outputFileSync('./.uebertool/vite-env.d.ts', `
/// <reference types="vite/client" />
/// <reference types="@ueberbit/vite-plugin-drupal/types/dom" />
/// <reference types="@ueberbit/vite-plugin-drupal/types/drupal" />
/// <reference types="@ueberbit/vite-plugin-drupal/types/once" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'

  const component: DefineComponent<{}, {}, any>
  export default component
}

declare module 'container-query-polyfill'`)
}

function generateTsConfig() {
  fse.outputJSON('./.uebertool/tsconfig.json', {
    compilerOptions: {
      target: 'ESNext',
      useDefineForClassFields: false,
      module: 'ESNext',
      lib: ['ESNext', 'DOM', 'DOM.Iterable'],
      moduleResolution: 'Node',
      strict: true,
      sourceMap: true,
      resolveJsonModule: true,
      isolatedModules: true,
      esModuleInterop: true,
      noEmit: true,
      noUnusedLocals: true,
      noUnusedParameters: true,
      noImplicitReturns: true,
      skipLibCheck: true,
      experimentalDecorators: true,
      baseUrl: '..',
      paths: {
        '~': [
          '.',
        ],
        '~/*': [
          './*',
        ],
        '@': [
          '.',
        ],
        '@/*': [
          './*',
        ],
        '~~': [
          '.',
        ],
        '~~/*': [
          './*',
        ],
        '@@': [
          '.',
        ],
        '@@/*': [
          './*',
        ],
        'assets': [
          'assets',
        ],
        'assets/*': [
          'assets/*',
        ],
        'public': [
          'public',
        ],
        'public/*': [
          'public/*',
        ],
      },
    },
    include: [
      '../js/**/*',
      '../templates/**/*',
      './unimport.d.ts',
      './vite-env.d.ts',
    ],
    exclude: [
      '**/node_modules',
      '**/dist',
      '**/*.stories.jsx',
      '**/.storybook/**/*',
      '**/*.js',
      '**/*.mdx',
      '**/*.tsx',
    ],
  }, {
    spaces: 2,
  },
  )
  fse.outputJSON('./.uebertool/tsconfig.node.json', {
    compilerOptions: {
      composite: true,
      module: 'ESNext',
      moduleResolution: 'Node',
      allowSyntheticDefaultImports: true,
    },
    include: ['vite.config.ts'],
  }, {
    spaces: 2,
  })
}
