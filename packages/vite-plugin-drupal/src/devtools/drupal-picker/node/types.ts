/**
 * What the browser-side picker sends back when the user clicks a region.
 *
 * `component` ids are SDC plugin ids (`provider:machine-name`) as emitted by
 * Drupal\Core\Template\ComponentNodeVisitor; `template` ids are the app-root
 * relative Twig paths Drupal\Core\Template\TwigThemeEngine prints in its theme
 * debug comments.
 */
export interface PickTarget {
  kind: 'component' | 'template'
  id: string
}

/** What the browser gets back for a resolved pick. */
export interface PickResult {
  /** Workspace-root relative path of the source file. */
  path: string
  /** Editor URL for the browser to open; set when Vite runs inside the ddev container. */
  url?: string
}

export interface DrupalPickerOptions {
  /**
   * Editor URL handed to the browser when Vite runs inside the ddev container.
   * `{path}` is replaced with the file's absolute path on the host.
   */
  editorUrl?: string
  /**
   * Absolute project path on the host. Derived from the container's bind mount
   * by default; set it when that guess is wrong.
   */
  hostRoot?: string
}

export interface DrupalPickerResolvedOptions {
  editorUrl: string
  hostRoot?: string
  /** Drupal's app root — where the theme debug comments' paths are relative to. */
  appRoot: string
  /**
   * Whether Vite runs inside the ddev web container. `launchEditor` shells out
   * wherever Vite runs, so in there it can never reach the developer's editor —
   * the browser, which runs on the host, has to perform the launch instead.
   */
  inContainer: boolean
}
