---
name: drupal
description: Additional instructions for working with drupal.
---

## Module README.md

Every custom module has a `README.md`, updated in the same change as the
code. It is for someone about to change *this module*. The architecture
skill covers how modules fit together. The two link to each other and don't
repeat each other: when a README explains something in depth, the
architecture skill gets one sentence and a "see its README".

Structure:

1. `# Name`, then one or two sentences on what the module owns and what it
   leaves to other modules.
2. `## Functionality` — a short bullet list of what it does.
3. One `##` section per topic that needs more than a bullet.
4. Where they exist: commands, settings and environment variables (a table),
   and anything operations has to do by hand.

**Write down:** which class owns which rule, constraints the code can't show
(why a hook rather than config, why it has no dependency on another module),
cache contexts and tags with the reason they are needed, security decisions,
traps, and known limitations.

**Leave out:**

- UI detail: icons, CSS, spacing, gin theming, which link sits where in a
  tray. If it needs explaining, put a comment next to the code.
- What the code states in one read: the steps of a method, a field list that
  mirrors the config, code samples of plain Drupal API.
- History: what it replaced, what was tried, "used to", "phase 2". Keep only
  a warning against going back, with the reason.
- Test coverage and counts.

Keep a topic to a paragraph or a few bullets. When you change the module,
delete what is no longer true.

## 3rd party packages

Before writing custom code check if there is a package by:
https://thephpleague.com/
https://symfony.com/packages
