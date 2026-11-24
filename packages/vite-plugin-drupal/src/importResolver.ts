import type { ComponentResolver } from 'unplugin-vue-components'
import { parse } from 'node:path'
import { globSync } from 'tinyglobby'

export default (): ComponentResolver => {
  const components = new Map<string, string>()
  globSync([
    '{js,templates,components}/**/*.ce.vue',
  ], {
    onlyFiles: true,
    ignore: [
      '**/node_modules/**',
      '**/dist/**',
      '**/*.eager.ce.vue',
      '**/*.visible.ce.vue',
      '**/*.idle.ce.vue',
      '**/*.lazy.ce.vue',
    ],
  }).forEach((component) => {
    const { name } = parse(component)
    const baseName = name.replace(/\.ce$/, '')
    const existing = components.get(baseName)
    if (existing)
      console.warn(`[uebertool] Duplicate component name "${baseName}": ~/${component} overrides ${existing}.`)
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
          from: components.get(componentName)!,
        }
      }
    },
  }
}
