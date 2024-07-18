import fse from 'fs-extra'

export function generateViteEnv() {
  fse.outputFileSync('./.uebertool/vite-env.d.ts', `
/// <reference types="vite/client" />
/// <reference types="@ueberbit/vite-plugin-drupal/types/dom" />
/// <reference types="@ueberbit/vite-plugin-drupal/types/drupal" />
/// <reference types="@ueberbit/vite-plugin-drupal/types/once" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'

  const component: DefineComponent<{}, {}, any>
  export default component
}`)
}

export function generateTsConfig() {
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
      checkJs: true,
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
      '../components/**/*',
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
  })
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

// eslint-disable-next-line no-console
console.log('Initializing Uebertool...')
generateViteEnv()
generateTsConfig()
