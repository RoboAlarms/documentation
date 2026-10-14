# Maintain the manual

This repository contains an independently buildable documentation website. Manual editions are deliberate reviews of specified software versions; a firmware commit alone does not refresh the documentation.

## Update content

1. Identify the affected controls and reviewed firmware, Flasher, Panel Manager, or integration revision.
2. Verify behavior against the implementation and applicable requirements. Keep planned behavior and unperformed hardware checks explicit.
3. Update the relevant task pages, cross-links, task index, glossary, and troubleshooting entries together.
4. Follow [CONTRIBUTING.md](CONTRIBUTING.md) and run `pnpm validate`.

## Replace screenshots

The existing capture and lab tooling remains with the firmware project. It requires that project's host preview, Flasher, Panel Manager fixtures, and integration sources; it is not part of this standalone website build.

Use the firmware checkout's `docs/manual/UPDATING.md` for the capture procedure. Generate captures in that separate checkout only when authorized to work there. Transfer only curated, reviewed images and their corresponding manifest records into this repository:

| Images | Manifest |
| --- | --- |
| `public/images/panel/` | `image-manifest.json` |
| `public/images/home-assistant/` | `home-assistant-manifest.json` |
| `public/images/flasher/`, `public/images/panel-manager/` | `browser-image-manifest.json` |

Keep stable image filenames. Preserve source revisions, capture dates, crop rectangles, dimensions, and hashes. Inspect every image for private information and meaningful warnings. Retained older captures must keep their original provenance and disclose differences from the current interface. Never copy authentication sessions, lab configuration, local notes, generated builds, or raw owner captures into this repository.

Manifest fields naming upstream fixture scripts describe historical capture provenance; those scripts intentionally remain outside this repository. `PanelShot.astro` uses manifest dimensions during the build, and `scripts/verify-images.mjs` verifies the curated files.

## Prepare an edition

Update `src/content/docs/reference/edition.mdx`, the landing page, and `src/components/DocsFooter.astro` consistently. Record the edition date, reviewed source revisions, software scope, screenshot limitations, and unperformed acceptance checks. Preserve any existing routes used by older bookmarks.

Run `pnpm validate`, build the Docker image, and review the production pages on desktop and mobile. In the pull request, state which checks passed and any remaining limitations.

After merging to `main`, Dokploy can rebuild and deploy automatically when configured as described in [Deployment](docs/deployment.md). The repository itself contains no deployment credentials or production access.
