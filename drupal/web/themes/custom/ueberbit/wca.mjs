import { analyzeText, transformAnalyzerResult } from "web-component-analyzer";
import fg from 'fast-glob'
import fs from 'node:fs'

const hyphenateRE = /\B([A-Z])/g
const hyphenate = (str) => str.replace(hyphenateRE, '-$1').toLowerCase()
const vueTagNameSet = new Set()

const files = fg.sync([
  '(js|templates)/**/*.ce.{vue,ts,tsx}',
], {
  onlyFiles: true,
}).flatMap(fileName => {
  const fileContent = fs.readFileSync(fileName, 'utf-8').toString()

  if (fileName.endsWith('.vue'))
    return extractVueDocs(fileName, fileContent)

  return fileContent
})

function getTagName(path) {
  const filename = path.split('/').at(-1)
  return filename ? `ueberbit-${hyphenate(filename.replace(/\.?(idle|visible|eager|lazy)?\.ce\.(vue|tsx|jsx|ts|js)$/, ''))}` : ''
}

function extractVueDocs(fileName, fileContent) {
  const docsBlock = fileContent.match(/<docs.*>([\s\S]*?)<\/docs>/g)
  const tagName = getTagName(fileName)

  vueTagNameSet.add(tagName)

  if (docsBlock) {
    const code = docsBlock.at(0).split('\n')
    code.pop()
    code.shift()
    code.push(`class _ extends HTMLElement {}`)
    code.push(`
    declare global {
      interface HTMLElementTagNameMap {
          "${tagName}": _;
      }
    }
    `)
    const text = code.join('\n')
    return text
  }
  return []
}

const { results, program } = analyzeText(files)

const vscode = transformAnalyzerResult('vscode', results, program)
fs.writeFileSync('./.uebertool/vscode.html-custom-data.json', vscode)

// const json = transformAnalyzerResult('json', results, program)
// fs.writeFileSync('./.uebertool/custom-elements.json', json)

const vueTagNameMap = Array.from(vueTagNameSet).reduce((a, c) => `${a}
    "${c}": HTMLElement`, `export {}

declare global {
  interface HTMLElementTagNameMap {`) + '\n  }\n}'

fs.writeFileSync('./.uebertool/vue-tagnames.d.ts', vueTagNameMap)
