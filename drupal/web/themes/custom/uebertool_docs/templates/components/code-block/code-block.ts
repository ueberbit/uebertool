/**
 * Syntax highlighting with Shiki (fine-grained bundle, JavaScript regex
 * engine) and a copy button. Attached automatically by uebertool_twig_loader
 * because this file shares its name with code-block.html.twig.
 */
import { createHighlighterCore } from 'shiki/core'
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript'

const highlighter = createHighlighterCore({
  themes: [
    import('@shikijs/themes/night-owl'),
    import('@shikijs/themes/night-owl-light'),
  ],
  engine: createJavaScriptRegexEngine(),
})

/**
 * Grammars are loaded on demand. Twig is highlighted with jinja-html: the
 * twig grammar pulls in PHP and is more than 1 MB.
 */
const languages: Record<string, () => Promise<any>> = {
  'typescript': () => import('@shikijs/langs/typescript'),
  'tsx': () => import('@shikijs/langs/tsx'),
  'vue': () => import('@shikijs/langs/vue'),
  'css': () => import('@shikijs/langs/css'),
  'json': () => import('@shikijs/langs/json'),
  'yaml': () => import('@shikijs/langs/yaml'),
  'html': () => import('@shikijs/langs/html'),
  'jinja-html': () => Promise.all([import('@shikijs/langs/jinja'), import('@shikijs/langs/jinja-html')]),
  'shellscript': () => import('@shikijs/langs/shellscript'),
}

const aliases: Record<string, string> = {
  ts: 'typescript',
  sh: 'shellscript',
  bash: 'shellscript',
  yml: 'yaml',
  twig: 'jinja-html',
}

async function highlight(pre: HTMLPreElement) {
  const lang = aliases[pre.dataset.language ?? ''] ?? pre.dataset.language ?? 'txt'
  if (!(lang in languages))
    return

  const shiki = await highlighter
  if (!shiki.getLoadedLanguages().includes(lang))
    await shiki.loadLanguage(...[await languages[lang]()].flat())

  const html = shiki.codeToHtml(pre.textContent ?? '', {
    lang,
    themes: { light: 'night-owl-light', dark: 'night-owl' },
    defaultColor: false,
  })
  const template = document.createElement('template')
  template.innerHTML = html
  const highlighted = template.content.querySelector('pre')
  if (highlighted) {
    pre.innerHTML = highlighted.innerHTML
    pre.classList.add('shiki')
  }
}

Drupal.behaviors.codeBlock = {
  attach(context) {
    once('code-block', '[data-code-block]', context).forEach((figure) => {
      const pre = figure.querySelector('pre')
      pre && highlight(pre)

      figure.querySelector<HTMLButtonElement>('[data-copy]')?.addEventListener('click', async (event) => {
        const button = event.currentTarget as HTMLButtonElement
        await navigator.clipboard.writeText(pre?.textContent ?? '')
        button.dataset.copied = ''
        setTimeout(() => delete button.dataset.copied, 1500)
      })
    })
  },
}

export {}
