import { parse } from 'node:path'
import { globSync } from 'tinyglobby'
import type { ComponentResolver } from 'unplugin-vue-components'

export default (): ComponentResolver => {
  const components = new Map()
  globSync([
    '(js|templates)/**/*.ce.vue',
  ], {
    onlyFiles: true,
    ignore: [
      '**/*.eager.ce.vue',
      '**/*.visible.ce.vue',
      '**/*.idle.ce.vue',
      '**/*.lazy.ce.vue',
    ],
  }).forEach((component) => {
    const { name } = parse(component)
    const baseName = name.replace(/\.ce$/, '')
    components.set(baseName, `~/${component}`)
  })

  return {
    type: 'component',
    resolve: (componentName: string) => {
      if (components.has(componentName)) {
        return {
          type: 'component',
          name: 'default',
          as: componentName,
          from: components.get(componentName),
        }
      }
    },
  }
}
