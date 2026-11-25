import type { DevToolsMessageLevel } from '@vitejs/devtools-kit'
import type { DockClientScriptContext } from '@vitejs/devtools-kit/client'
import type { OutlineLevel, OutlineTarget } from './outline'
import axe from 'axe-core'
import { createOutline } from './outline'

const SUMMARY_MESSAGE_ID = 'a11y-checker-summary'

/**
 * A dock id no dock owns. Activating it is how a message in the panel reaches
 * this script: the request carries the dock id plus an opaque `params` bag, and
 * an id nothing owns leaves the panel's own dock selection alone. Activating
 * the real `a11y-checker` entry instead would run the audit again and pull the
 * panel away from the message the user clicked in.
 */
const OUTLINE_DOCK_ID = 'a11y-checker:outline'
/** The client RPC event the hub broadcasts for every activation request. */
const ACTIVATE_EVENT = 'devframe:docks:activate'
/** The client RPC event the hub broadcasts whenever the message feed changes. */
const MESSAGES_UPDATED_EVENT = 'devframe:messages:updated'
/** `params.outline` value asking for every violation at once. No axe rule uses it. */
const ALL = 'all'

interface Activation {
  dockId: string
  params?: { outline?: string, help?: string }
}

// DevTools re-runs an action dock's setup script on every click, so what has to
// outlive a single run — the results the outline buttons point at, and the
// overlay itself — lives in module scope rather than in the setup closure.
const outline = createOutline()
/** Rule id → the elements it was reported on, in audit order. */
const found = new Map<string, OutlineTarget[]>()
/**
 * The outline button each request belongs to. The panel renders the button
 * itself, so its label is the only place this script can show whether that
 * outline is currently up.
 */
const buttons = new Map<string, Button>()
/** Rule id → the axe help page for it, opened by the message's help button. */
const help = new Map<string, string>()
/** The request the boxes on screen belong to, so a second click takes them down. */
let showing: string | null = null
let wired = false

interface Button {
  /** The message carrying the button. */
  messageId: string
  /** Label while the outline is down, and while it is up. */
  idle: string
  active: string
}

/** The action the panel renders for `request`, labelled for the current state. */
function action(request: string, button: Button, active: boolean) {
  return {
    id: 'outline',
    label: active ? button.active : button.idle,
    kind: 'activate' as const,
    activate: {
      dockId: OUTLINE_DOCK_ID,
      params: { outline: request },
    },
  }
}

/** Every action a request's message carries, labelled for the current state. */
function actionsFor(request: string, active: boolean) {
  const button = buttons.get(request)
  return [
    ...button
      ? [
          action(request, button, active),
        ]
      : [],
    ...help.has(request)
      ? [
          helpAction(request),
        ]
      : [],
  ]
}

/** The action that opens a rule's axe help page. */
function helpAction(rule: string) {
  return {
    id: 'help',
    label: 'More information',
    kind: 'activate' as const,
    activate: {
      dockId: OUTLINE_DOCK_ID,
      params: { help: rule },
    },
  }
}

/**
 * Open a rule's help page. The click reaches every open tab, so only the page
 * holding this audit's results answers it — otherwise every tab would open its
 * own copy. `noopener` gives back no window handle, so there is nothing to
 * check here: a browser that refuses the popup reports that itself.
 */
function openHelp(rule: string) {
  const url = help.get(rule)
  if (!url)
    return

  // The URL comes from axe-core rather than from the page, but the message data
  // is round-tripped through the hub, so only ever hand a web URL to the browser.
  if (!/^https?:\/\//.test(url))
    return

  window.open(url, '_blank', 'noopener')
}

/** Relabel a request's button to say whether its outline is up. */
async function setActive(context: DockClientScriptContext, request: string, active: boolean) {
  const button = buttons.get(request)
  if (!button)
    return
  // The kit's RPC client is typed against the built-in server functions only,
  // so these methods need a widened view of `call`.
  const call = context.rpc.call as (name: string, ...args: unknown[]) => Promise<unknown>
  await call('hub:messages:update', button.messageId, {
    actions: actionsFor(request, active),
  })
}

/** Take the boxes down and put their button back into its idle state. */
function hide(context: DockClientScriptContext) {
  outline.clear()
  if (showing)
    void setActive(context, showing, false)
  showing = null
}

function impactToLevel(impact: string | undefined | null): DevToolsMessageLevel {
  switch (impact) {
    case 'critical':
    case 'serious':
      return 'error'
    case 'moderate':
      return 'warn'
    case 'minor':
    default:
      return 'info'
  }
}

function levelToOutline(level: DevToolsMessageLevel): OutlineLevel {
  return level === 'error' || level === 'warn'
    ? level
    : 'info'
}

/**
 * axe reports a target as one entry per document boundary — an iframe or a
 * shadow root it had to step through — so the entries are not a descendant
 * chain and joining them into a single selector yields one that matches
 * nothing. Show the boundaries instead of pretending it is a selector.
 */
function formatTarget(target: axe.UnlabelledFrameSelector): string {
  return target.flat().join(' >> ')
}

/**
 * Tag families that do not earn a chip: axe's internal `cat.*` taxonomy, the
 * French RGAA scheme, and the US Trusted Tester one.
 */
const SKIPPED_TAGS = ['cat.', 'RGAA', 'TT']

/**
 * The conformance tags to show as labels, so a violation carries its WCAG level
 * and criterion (`wcag2a`, `wcag412`) next to the other standards that cite it
 * (EN 301 549, Section 508, ACT). WCAG sorts first; the panel filters by label,
 * so the rest earn their place too.
 */
function labelsOf(tags: string[]): string[] {
  const shown = tags.filter(tag => !SKIPPED_TAGS.some(prefix => tag.startsWith(prefix)))
  return [
    ...shown.filter(tag => tag.startsWith('wcag')),
    ...shown.filter(tag => !tag.startsWith('wcag')),
  ]
}

function plural(count: number, noun: string): string {
  return `${count} ${noun}${count === 1
    ? ''
    : 's'}`
}

function notify(context: DockClientScriptContext, message: string, description: string) {
  context.messages.add({
    message,
    description,
    level: 'info',
    category: 'a11y',
    notify: true,
    autoDismiss: 4000,
    autoDelete: 10000,
  })
}

/** Outline one rule's elements, or every violation's when asked for {@link ALL}. */
function draw(context: DockClientScriptContext, request: string) {
  const targets = request === ALL
    ? [
        ...found.values(),
      ].flat()
    : found.get(request) ?? []

  hide(context)

  // The message feed is shared, so a click reaches every open tab. Only the
  // page holding the audit's results answers it; the rest stay quiet rather
  // than posting a notice into the feed the others are reading.
  if (!targets.length)
    return

  if (!outline.show(targets)) {
    notify(
      context,
      `Nothing to outline for ${request === ALL
        ? 'this audit'
        : request}`,
      'The reported elements are no longer in the document, or render no box of '
      + 'their own — a violation on `<html>` or `<meta>`, for instance.',
    )
    return
  }

  showing = request
  void setActive(context, request, true)
}

/**
 * Take the boxes down once the message they belong to is dismissed — its button
 * is gone with it, so there would be no way to clear them again.
 */
async function dropDismissed(context: DockClientScriptContext) {
  if (!showing || !outline.visible)
    return

  const call = context.rpc.call as (name: string, ...args: unknown[]) => Promise<unknown>
  const id = buttons.get(showing)?.messageId
  const list = await call('devframes:plugin:messages:list') as { entries: { id: string }[] }
  if (!id || list.entries.some(entry => entry.id === id))
    return

  // Nothing to relabel — the button went with the message.
  outline.clear()
  showing = null
}

/**
 * Handle a client RPC event the hub broadcasts. Something else usually owns the
 * event already, so chain the registered handler the way the hub itself chains
 * onto an existing definition rather than replacing it.
 */
function onBroadcast(
  context: DockClientScriptContext,
  name: string,
  handle: (...args: unknown[]) => void,
) {
  const definitions = context.rpc.client.definitions as
    Map<string, { handler?: (...args: unknown[]) => unknown }>
  const existing = definitions.get(name)

  if (!existing) {
    context.rpc.client.register({ name, type: 'action', handler: handle })
    return
  }

  const previous = existing.handler
  existing.handler = (...args) => {
    handle(...args)
    return previous?.(...args)
  }
}

/**
 * Wire the overlay to the panel. The hub also mirrors every activation request
 * into the `devframe:docks:active` shared state, but that only reports
 * changes* — the same button clicked twice writes the same value and would go
 * unnoticed — so listen to the broadcasts instead.
 */
function wire(context: DockClientScriptContext) {
  if (wired)
    return
  wired = true

  onBroadcast(context, ACTIVATE_EVENT, (...args) => {
    const activation = args[0] as Activation | undefined
    if (activation?.dockId !== OUTLINE_DOCK_ID)
      return

    if (activation.params?.help) {
      openHelp(activation.params.help)
      return
    }

    const request = activation.params?.outline
    if (!request)
      return

    // A second click on the same button takes its outline down again.
    if (request === showing && outline.visible)
      hide(context)
    else
      draw(context, request)
  })

  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && outline.visible)
      hide(context)
  }, true)

  onBroadcast(context, MESSAGES_UPDATED_EVENT, () => void dropDismissed(context))
}

export default async function runA11yCheck(context: DockClientScriptContext): Promise<void> {
  const { messages } = context
  wire(context)
  hide(context)
  found.clear()
  buttons.clear()
  help.clear()

  const summary = await messages.add({
    id: SUMMARY_MESSAGE_ID,
    message: 'Running accessibility audit...',
    level: 'info',
    category: 'a11y',
    status: 'loading',
    notify: true,
  })

  try {
    // `elementRef` hands back the offending nodes themselves, so the overlay
    // never has to resolve a selector back to an element.
    const results = await axe.run(
      {
        exclude: ['vite-devtools-dock-embedded'],
      },
      { elementRef: true },
    )

    for (const violation of results.violations) {
      const level = impactToLevel(violation.impact)
      const firstNode = violation.nodes[0]

      const targets = violation.nodes
        .filter(node => node.element)
        .map(node => ({
          element: node.element!,
          label: violation.id,
          level: levelToOutline(level),
        }))
      found.set(violation.id, targets)
      if (violation.helpUrl)
        help.set(violation.id, violation.helpUrl)
      const button: Button | undefined = targets.length
        ? {
            messageId: `a11y-violation-${violation.id}`,
            idle: `Outline ${plural(targets.length, 'element')}`,
            active: 'Hide outline',
          }
        : undefined
      if (button)
        buttons.set(violation.id, button)

      // Fire-and-forget — no need to await when handle isn't needed
      messages.add({
        id: `a11y-violation-${violation.id}`,
        message: violation.description,
        level,
        description: `${violation.help}\n\n${violation.helpUrl}`,
        category: 'a11y',
        labels: labelsOf(violation.tags),
        elementPosition: firstNode
          ? {
              selector: formatTarget(firstNode.target),
              description: firstNode.html,
            }
          : undefined,
        actions: actionsFor(violation.id, false),
      })
    }

    const violationCount = results.violations.length
    const passCount = results.passes.length
    const elementCount = [
      ...found.values(),
    ].reduce((total, targets) => total + targets.length, 0)
    const all: Button | undefined = elementCount
      ? {
          messageId: SUMMARY_MESSAGE_ID,
          idle: `Outline all ${plural(elementCount, 'element')}`,
          active: 'Hide all outlines',
        }
      : undefined
    if (all)
      buttons.set(ALL, all)

    // Update the summary log via handle
    await summary.update({
      message: violationCount > 0
        ? `Found ${plural(violationCount, 'violation')}, ${passCount} passed`
        : `All ${passCount} checks passed`,
      level: violationCount > 0
        ? 'warn'
        : 'success',
      status: 'idle',
      notify: true,
      autoDismiss: 4000,
      actions: actionsFor(ALL, false),
    })
  }
  catch (err) {
    // Update the summary log with error via handle
    await summary.update({
      message: 'A11y audit failed',
      level: 'error',
      description: String(err),
      status: 'idle',
      notify: true,
    })
  }
}
