import { configure, initJsBehaviors } from '@wingsuit-designsystem/storybook'
import { TwingRenderer } from '@wingsuit-designsystem/pattern'
import { addParameters } from '@storybook/react'
import resolveConfig from 'tailwindcss/resolveConfig'
import { TwingFunction } from 'twing'

import tailwindConfig from '../tailwind.config'
import namespaces from './namespaces'
import { getBreakpoints } from './utils.js'

const resolvedTailwindConfig = resolveConfig(tailwindConfig)

const renderImpl = new TwingRenderer()
const twingEnvironment = renderImpl.getEnvironment()

twingEnvironment.addFunction(new TwingFunction('import', (src) => {
  const script = document.createElement('script')
  script.src = src
  script.type = 'module'
  document.body.appendChild(script)
  return Promise.resolve()
}))

initJsBehaviors('Drupal')

addParameters({
  viewport: {
    viewports: {
      ...getBreakpoints(resolvedTailwindConfig, true),
    },
  },
  themes: {
    list: [
      {
        name: 'dark',
        color: '#111111',
        class: 'dark',
      },
    ],
    target: 'html',
  },
  options: {
    storySort: {
      method: 'alphabetical',
      order: [
        'Welcome',
        'Layout',
        'Tokens',
        ['Colors', 'Typography', 'Scales'],
        'Atoms',
        'Molecules',
        'Organisms',
        'Templates',
        'Pages',
      ],
      locales: 'en-US',
    },
  },
})

configure(
  module,
  [
    require.context('./patterns', true, /\.stories(\.jsx|\.js|\.mdx)$/),
    require.context('../', true, /\.stories(\.jsx|\.js|\.mdx)$/),
  ],
  require.context('./', false, /\.json|\.ya?ml$/),
  require.context('../', true, /\.twig$/),
  namespaces,
  renderImpl,
)
