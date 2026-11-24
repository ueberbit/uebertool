import MagicString from 'magic-string'

const ceVueRE = /\.ce\.vue$/
const scriptSetupRE = /<script\b[^>]*\ssetup\b[^>]*>/
const scriptLangRE = /<script\b[^>]*\slang=(["'])(.*?)\1/

/**
 * Inject a statement into the `<script setup>` block of a `*.ce.vue` SFC.
 * Appends a `<script setup>` block with the language of an existing
 * `<script>` block if there is none, so a later injection finds it.
 */
export function injectSetup(code: string, id: string, statement: string) {
  if (!ceVueRE.test(id))
    return

  const s = new MagicString(code)
  const setupMatch = code.match(scriptSetupRE)

  if (setupMatch) {
    s.appendLeft(setupMatch.index! + setupMatch[0].length, statement)
  }
  else {
    const lang = code.match(scriptLangRE)?.[2]
    const langAttr = lang
      ? ` lang="${lang}"`
      : ''
    s.append(`\n<script setup${langAttr}>${statement}</script>\n`)
  }

  return {
    code: s.toString(),
    map: s.generateMap({ hires: true }),
  }
}
