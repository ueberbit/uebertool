import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: [
    'src/index',
  ],
  clean: true,
  declaration: true,
  externals: [
    'unconfig',
  ],
  rollup: {
    emitCJS: true,
    inlineDependencies: true,
  },
})
