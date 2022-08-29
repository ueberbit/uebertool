import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { delNestedKey, hasNestedKey, setNestedKey } from './objects'

/**
 * Utility for modifying JSON based config files.
 */
export class JSONConfig {
  filePath: string
  content: Record<string, any>

  constructor(filePath) {
    this.filePath = filePath

    if (!existsSync(filePath))
      // throw new Error(`File ${filePath} does not exist!`)
      writeFileSync(filePath, '{}')

    this.content = JSON.parse(readFileSync(this.filePath).toString())
  }

  add(key, value) {
    setNestedKey(this.content, key, value)
    return this
  }

  remove(key) {
    delNestedKey(this.content, key)
    return this
  }

  has(key) {
    return hasNestedKey(this.content, key)
  }

  save() {
    writeFileSync(this.filePath, `${JSON.stringify(this.content, null, 2)}\n`)
  }
}
