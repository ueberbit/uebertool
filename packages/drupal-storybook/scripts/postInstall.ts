import path from 'path'
import fs from 'fs-extra'

const cwd = process.env.INIT_CWD || ''
const base = path.resolve(__dirname, '../')
const storybookDir = '.storybook'

if (cwd === process.cwd())
  process.exit()

const copyLibs = async () => {
  !fs.pathExistsSync(path.join(cwd, storybookDir))
    && await fs.copy(
      path.join(base, 'src'),
      path.join(cwd, '.storybook'),
    )
}

const prepareJSON = async () => {
  const pkgJson = await fs.readJSON(path.join(cwd, 'package.json'))

  const deps = [...Object.keys(pkgJson.dependencies), ...Object.keys(pkgJson.devDependencies)]

  if (!deps.includes('@ueberbit/drupal-storybook'))
    process.exit()

  if (!pkgJson.scripts)
    pkgJson.scripts = {}

  if (!Object.keys(pkgJson.scripts).includes('dev:storybook'))
    pkgJson.scripts['dev:storybook'] = `start-storybook -p 5174 --config-dir ${storybookDir} --ci`

  if (!Object.keys(pkgJson.scripts).includes('build:storybook'))
    pkgJson.scripts['build:storybook'] = `build-storybook --config-dir ${storybookDir}`

  await fs.writeJSON(path.join(cwd, 'package.json'), pkgJson, { spaces: 2 })
}

;(async () => {
  // await prepareJSON()
  // await copyLibs()
})()
