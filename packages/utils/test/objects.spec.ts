import { beforeEach, describe, expect, it } from 'vitest'
import { delNestedKey, hasNestedKey, setNestedKey } from '../src//objects'

var mock: Record<string, any>

beforeEach(async () => {
  mock = {
    a: {
      b: {
        c: {
          d: 'value',
        },
        e: false,
      },
    },
    f: true,
  }
})

/**
 * delNestedKey()
 */
describe('delNestedKey()', () => {
  it('Should remove nested key', () => {
    delNestedKey(mock, ['a', 'b', 'e'])
    expect(mock).toEqual({
      a: {
        b: {
          c: {
            d: 'value',
          },
        },
      },
      f: true,
    })
  })

  it('Should remove nested key root', () => {
    delNestedKey(mock, ['f'])
    expect(mock).toEqual({
      a: {
        b: {
          c: {
            d: 'value',
          },
          e: false,
        },
      },
    })
  })
})

/**
 * hasNestedKey()
 */
describe('hasNestedKey()', () => {
  it('Should be truthy if has key', () => {
    expect(hasNestedKey(mock, ['a', 'b', 'c', 'd'])).toBeTruthy()
  })

  it('Should be falsy if it does not have key', () => {
    expect(hasNestedKey(mock, ['a', 'b', 'c', 'j'])).toBeFalsy()
  })
})

/**
 * hasNestedKey()
 */
describe('setNestedKey()', () => {
  it('Should set nested value', () => {
    setNestedKey(mock, ['a', 'b', 'c', 'g', 'h'], 'new value')
    expect(mock).toEqual({
      a: {
        b: {
          c: {
            d: 'value',
            g: {
              h: 'new value',
            },
          },
          e: false,
        },
      },
      f: true,
    })
  })
})
