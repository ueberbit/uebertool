/**
 * Adds a nested key in a Object.
 */
export const setNestedKey = (obj: Record<string, any>, path: string[], value: any) => {
  if (path.length === 1) {
    obj[path[0]] = value
    return
  }
  if (obj[path[0]] === undefined) {
    obj[path[0]] = {}
  }
  return setNestedKey(obj[path[0]], path.slice(1), value)
}

/**
 * Removes a nested key in a Object.
 */
export const delNestedKey = (obj: Record<string, any>, path: string[]) => {
  if (path.length) {
    const prop = path.pop() as string
    const c =  path.reduce((a, c) => a[c], obj)
    delete c[prop]  
  }
}

/**
 * Checks if object has a nested key.
 */
export const hasNestedKey = (obj: Record<string, any>, path: string[]) => {
  return !!path.reduce((obj, level) => obj && obj[level], obj)
}
