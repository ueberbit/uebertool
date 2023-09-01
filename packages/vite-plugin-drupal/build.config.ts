import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: [
    'src/index',
    'src/composables',
    'src/ce/ApiCustomElements',
    'src/bootstrap',
  ],
  clean: true,
  declaration: true,
  externals: [
    'unconfig',
    'magic-string',
  ],
  rollup: {
    emitCJS: true,
    inlineDependencies: true,
  },
})
