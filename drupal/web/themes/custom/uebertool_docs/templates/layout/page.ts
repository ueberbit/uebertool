/**
 * Behaviour of the docs layout: theme switcher and "On this page".
 * Attached automatically together with page.html.twig.
 */
const STORAGE_KEY = 'uebertool-docs-theme'

function storedTheme() {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? 'auto'
  }
  catch {
    return 'auto'
  }
}

function applyTheme(choice: string) {
  const dark = choice === 'dark' || (choice === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.dataset.theme = dark ? 'dark' : 'light'
}

const slugify = (text: string) => text.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')

function buildToc(toc: HTMLElement) {
  const headings = Array.from(document.querySelectorAll<HTMLHeadingElement>('.sl-markdown :is(h2, h3)'))
    .filter(heading => !heading.closest('.not-prose'))
  const links = new Map<Element, HTMLAnchorElement>()

  const entries: [HTMLElement, string, number][] = [
    [
      document.getElementById('_top')!,
      'Overview',
      2,
    ],
  ]
  headings.forEach((heading) => {
    heading.id ||= slugify(heading.textContent ?? '')
    entries.push([
      heading,
      heading.textContent ?? '',
      heading.tagName === 'H2'
        ? 2
        : 3,
    ])
  })

  entries.forEach(([heading, text, level]) => {
    const li = document.createElement('li')
    const a = document.createElement('a')
    a.href = `#${heading.id}`
    a.textContent = text
    a.dataset.level = String(level)
    li.append(a)
    toc.append(li)
    links.set(heading, a)
  })

  // Highlight the last heading that scrolled past the header.
  const update = () => {
    let current = entries[0][0]
    for (const [heading] of entries) {
      if (heading.getBoundingClientRect().top < 100)
        current = heading
    }
    links.forEach((a, heading) => a.toggleAttribute('aria-current', heading === current))
  }
  addEventListener('scroll', update, { passive: true })
  update()
}

Drupal.behaviors.docsLayout = {
  attach(context) {
    once('theme-select', '[data-theme-select]', context).forEach((select) => {
      const element = select as HTMLSelectElement
      element.value = storedTheme()
      element.addEventListener('change', () => {
        try {
          localStorage.setItem(STORAGE_KEY, element.value)
        }
        catch {}
        applyTheme(element.value)
      })
    })
    matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => applyTheme(storedTheme()))

    once('toc', '[data-toc]', context).forEach(toc => buildToc(toc))
  },
}

export {}
