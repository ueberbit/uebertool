/* eslint-disable no-console */
import path from 'path'
import { exec } from 'child_process'
import fs from 'fs-extra'
import rimraf from 'rimraf'
import { build } from 'vite'

const __dirname = path.resolve()

/**
 * Dist dirs.
 */
const dirs = {
  dist: path.resolve(__dirname, './dist/'),
  sb: path.resolve(__dirname, './node_modules/.cache/storybook/build/'),
}

/**
 * Clean Output dir.
 */
Object.values(dirs).forEach(val => rimraf.sync(`${val}/*`))

const delta = (stamp) => {
  return `${((new Date().getTime() - stamp) / 600).toFixed(2)}s`
}

;(async () => {
  try {
    /** Vite */
    const viteStart = new Date().getTime()
    build().then(() => {
      console.log(`FE build done in ${delta(viteStart)}`)
    })

    /** Storybook */
    const sbStart = new Date().getTime()
    exec(`pnpm exec build-storybook --config-dir .storybook -o ${dirs.sb}`, () => {
      console.log(`Storybook build in ${delta(sbStart)}`)
      fs.copy(dirs.sb, dirs.dist)
    })
  }
  catch (err) {
    console.error(err)
    process.exit(1)
  }
})()
