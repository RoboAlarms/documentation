# Maintain the documentation

This repository builds the documentation site on its own. The capture tools in `tools-capture/`
need a checkout of the firmware repository; the site build does not.

## Update content

1. Find the controls that changed in the firmware, Flasher, Panel Manager or Home Assistant integration.
2. Check the behaviour and the exact labels in the source. The English words on the panel are in
   `components/ui/alarm_ui/src/ui_*.c`; Panel Manager words are in `components/services/panel_web/web/`.
3. Update the task pages, the related links, the task index, the glossary, the FAQ and the
   troubleshooting page together.
4. Follow the [writing guide](docs/writing-guide.md) and the [maintenance guidelines](docs/maintenance.md).
5. Run `pnpm validate`.

## Replace screenshots

Screenshots use fictional data. The panel captures change both factory codes before every screen,
so no screenshot shows a factory-code warning. Never use real codes, names, addresses or networks.

1. Render the panel screens. From this repository, with the firmware repository next to it
   (`../alarm-panel`) and its host toolchain installed:

   ```powershell
   pwsh tools-capture/capture-panel.ps1            # -AlarmPanel <path> for another location
   ```

   The script stages copies of the host preview in the firmware repository's ignored `build/`
   folder and changes no tracked file there. It writes the shots to
   `../alarm-panel/build/docs-preview/shots`. Copy them to `.capture/panel/` (ignored by Git).
   The run must end with exit code 0 and `capture-status.json` must report `completed`.
2. Capture Panel Manager and Flasher pages into `.capture/panel-manager/` and `.capture/flasher/`
   as `tools-capture/browser/README.md` describes.
3. Choose the screenshots for each page in `tools-capture/shots/*.json`: the published name, the
   capture file and an optional crop rectangle.
4. Run `node tools-capture/curate.mjs`. It copies and crops the images into `public/images/` and
   writes `image-manifest.json` (source, crop, size and hash of each image).
5. Look at every changed image at full size. Remove images that no page uses.
6. Run `pnpm validate`. `scripts/verify-images.mjs` fails on an image that is missing from the
   manifest, unused, changed after curation or blank.

## Before a release of the site

Run `pnpm validate`, build the Docker image and review the pages on a desktop and on a phone, in
the light and dark themes. Updates to `main` can start a deployment when Dokploy is set up as
[Deployment](docs/deployment.md) describes. The repository contains no deployment credentials.
