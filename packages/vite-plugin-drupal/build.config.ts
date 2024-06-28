import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: [
    'src/index',
    'src/composables',
    'src/ce/ApiCustomElements',
    'src/bootstrap',
  ],
  externals: ['vite', 'typescript'],
  clean: true,
  declaration: true,
  rollup: {
    emitCJS: false,
    inlineDependencies: true,
  },
})
