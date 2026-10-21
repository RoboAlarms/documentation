# Documentation maintenance

## Write pages

- Write every page by the [writing guide](writing-guide.md).
- Put a page in the correct folder under `src/content/docs/`: `start/`, `user/`, `installer/`,
  `flasher/`, `panel-manager/`, `integrations/` or `reference/`.
- Add each new page to the `sidebar` list in `astro.config.mjs`. The list sets the order.
- Give each page `title`, `description` and `audience` in its frontmatter, and `time` for a task.
- Keep existing URLs and section anchors. Update the task index and the related links when you add a page.

Use fictional names and documentation addresses such as `192.0.2.42`. Never include real codes,
passwords, tokens, serial numbers, MAC addresses, network names or personal file paths. Look at
the screenshots as well as the text.

## Components

| Component | Use |
| --- | --- |
| `PanelShot` | A screenshot in a device frame. Its size comes from the PNG. |
| `GuideCard` | A card on the home page. |
| `DocsHeader`, `DocsFooter`, `DocsPageTitle` | The website's header and footer, and the audience labels under the title. |
| Starlight `Steps`, `Aside`, `Tabs`, `LinkCard` | Steps, notes and warnings, alternatives, links. |

The colours and type in `src/styles/custom.css` match roboalarms.com. Change them in both places.

## Validate a change

From the repository root:

```sh
pnpm install --frozen-lockfile
pnpm validate
git diff --check
pnpm preview
```

Look at the changed pages in the production preview on a desktop and on a narrow phone screen,
in the light and dark themes. Check the navigation, tables, captions, enlarged images, keyboard
focus and search.

When you change dependencies, use the pinned pnpm version, update `pnpm-lock.yaml` and build the
Docker image. CI runs the same validation in the production build and tests the server.

Read [UPDATING.md](../UPDATING.md) before you change screenshots.
