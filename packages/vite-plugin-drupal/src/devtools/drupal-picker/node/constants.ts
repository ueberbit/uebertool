export const DEFAULT_EDITOR_URL = 'vscode://file{path}:1'

// Walked up to from the Vite root to find Drupal's app root.
export const APP_ROOT_MARKER = 'core/lib/Drupal.php'

// ddev generates this compose file on the host and mounts it into the
// container, so the host project path it stamps on each service is readable
// from in here.
export const DDEV_COMPOSE_FILE = '/mnt/ddev_config/.ddev-docker-compose-full.yaml'
export const DDEV_APPROOT_LABEL = /^[ \t]*com\.ddev\.approot:[ \t]*["']?([^"'\s](?:[^"'\n]*[^"'\s])?)["']?[ \t]*$/m

export const YML_SUFFIX = '.component.yml'
export const INFO_SUFFIX = '.info.yml'
export const SCRIPT_EXTENSIONS = ['ts', 'js']

// A component whose Twig is nothing but an extends of an `sdc-custom-element`
// bridge renders `<tag-name>` and hands everything to its custom element, so the
// Twig holds no markup — the element class in the sibling script does the work.
export const CUSTOM_ELEMENT_BRIDGE = /\{%-?\s*extends\s*['"][^'"]*sdc-custom-element\.twig['"]/

// Drupal only ships components under an extension's `components/` directory, so
// these two globs cover core, contrib and custom without walking `libraries/`,
// `sites/*/files/` or any of the vendored front-end trees.
export const COMPONENT_GLOBS = [
  `core/{modules,themes}/*/components/**/*${YML_SUFFIX}`,
  `{modules,themes,profiles}/**/components/**/*${YML_SUFFIX}`,
]
