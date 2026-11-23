This is a ddev project. You can find the the ddev config in `.ddev`.

This repository is a pnpm monorepo of UEBERBIT's shared tooling (`packages/*`).
`drupal/` is a local, gitignored Drupal playground (docroot `drupal/web`,
composer root `drupal`) used to try the Drupal packages.

Always run these command in the container via ddev:
- pnpm
- node
- php
- composer
- mysql
- drush
- any binary installed by pnpm or composer (e.g. eslint, drush, etc.)

e.g. `ddev exec pnpm run lint` or `ddev drush cr`.

## Which checks to run

Don't run every suite after every change. Pick by what the diff touches,
narrowest scope first:

- **JS/TS in a package**: eslint on the changed files only.
- **Docs, READMEs, SKILL.md, config YAML, CSS**: no test run.

Run the full lint (`pnpm run lint`) only before a commit that spans several
packages, or when asked.

## Performance

Always keep in mind to write efficient code that scales nicely. Avoid unnecessary queries, and make
sure to use caching where possible. Inform me if I suggest any poorly performing code
or data structure and propose a better solution.

## Skills

When working on the Drupal packages (`packages/uebertool-companion`,
`packages/drupal-starterkit-theme`) or in `drupal/`, always use these skills:
- drupal
- drupal-expert
- drupal-security
