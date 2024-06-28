import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: [
    'src/plugins/stripcolor',
  ],
  clean: true,
  declaration: true,
  externals: [
    'unconfig',
  ],
  rollup: {
    emitCJS: false,
    inlineDependencies: true,
  },
})
