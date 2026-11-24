import { defineBuildConfig } from 'obuild/config'

// `dependencies` and `peerDependencies` stay external, everything else
// (devDependencies like web-component-analyzer) is bundled.
export default defineBuildConfig({
  entries: [
    {
      type: 'bundle',
      input: [
        './src/index.ts',
        './src/composables.ts',
        './src/ce/ApiCustomElements.ts',
        './src/bootstrap.ts',
      ],
    },
  ],
})
