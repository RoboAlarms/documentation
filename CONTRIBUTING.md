# Contributing to the manual

Make focused changes on a branch and open a pull request describing the affected pages, software versions, and checks performed. Documentation errors and missing explanations can also be reported through GitHub issues.

## Write useful instructions

- Put pages in the appropriate guide under `src/content/docs/`.
- Include a descriptive title and description in each page's frontmatter.
- Name controls exactly as they appear in the reviewed software.
- Explain prerequisites, access role, starting state, steps, expected result, and recovery where relevant.
- Distinguish software support, unreleased features, simulator results, and hardware acceptance.
- Preserve established URLs and section anchors where possible; update the task index and cross-links when adding topics.
- Use descriptive link text, screenshot captions, and image alt text.

Use fictional names and documentation addresses such as `192.0.2.42`. Never include real codes, passwords, tokens, serial numbers, MAC addresses, private network names, or personal file paths. Inspect screenshots as well as text. Example pairing digits must be clearly identified as fictional.

## Validate a change

From the repository root:

```sh
pnpm install --frozen-lockfile
pnpm validate
git diff --check
pnpm preview
```

Review changed pages in the production preview on desktop and narrow mobile screens, in both light and dark themes. Check navigation, tables, captions, enlarged images, keyboard focus, and production search. Automated checks confirm links and image integrity; visual and editorial review remain necessary.

When changing dependencies, use the pinned pnpm version, update `pnpm-lock.yaml`, and verify the Docker build. CI runs the same validation inside the production build and smoke-tests the resulting server.

See [UPDATING.md](UPDATING.md) before changing screenshots or preparing a new documentation edition.
