# Working on RoboAlarms Documentation

- This checkout is the standalone documentation site. Work only in this repository unless the user explicitly authorizes work elsewhere.
- Start with `git status` and the relevant documentation pages. Preserve existing changes.
- Read README.md, docs/writing-guide.md, docs/maintenance.md and UPDATING.md before changing content, assets or the build.
- External contributions are not being accepted at this time.
- Use RoboAlarms Panel as the panel project's name. Keep documentation free of references to unrelated alarm companies or their products.
- Keep the public repository free of personal details, real installation credentials and authentication sessions. Inspect screenshot content as well as text.
- Preserve page routes, image provenance (`image-manifest.json`) and upstream license attribution.
- Write every page by `docs/writing-guide.md`.
- A website build requires no firmware checkout, hardware connection or credentials. The capture tools in `tools-capture/` need the firmware checkout; see UPDATING.md.
- Run `pnpm validate` for content or asset changes. Build and smoke-test Docker when changing deployment files.
- Describe checks actually performed; a successful build is not hardware acceptance or a verified production deployment.
- Do not commit, push or deploy unless authorized by the user.
