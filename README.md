# RoboAlarms Documentation

The source for the [RoboAlarms documentation website](https://docs.roboalarms.com): practical guides for users, installers, Home Assistant integrations, the Flasher, and the Panel Manager.

Built with [Astro](https://astro.build) and [Starlight](https://starlight.astro.build). This repository builds independently of the alarm firmware. The current manual edition and reviewed software versions are documented in [About this edition](src/content/docs/reference/edition.mdx).

## Develop locally

Install Node.js 24 LTS and pnpm 11.25.0, then:

```sh
git clone https://github.com/RoboAlarms/documentation.git
cd documentation
pnpm install --frozen-lockfile
pnpm dev
```

Open the loopback URL printed by Astro, normally `http://127.0.0.1:4321`.

```sh
pnpm validate                  # type checks, production build, links, and images
pnpm preview                   # inspect the production build locally
```

The package manager is pinned in `package.json`; dependencies are recorded in `pnpm-lock.yaml`.

## Repository layout

| Path | Purpose |
| --- | --- |
| `src/content/docs/` | Manual pages, grouped by guide |
| `src/components/`, `src/styles/` | Shared components and site styling |
| `src/assets/`, `public/` | Brand assets and curated screenshots |
| `*-manifest.json` | Screenshot dimensions, hashes, and provenance |
| `scripts/` | Production link and image verification |
| `Dockerfile`, `docker/` | Production image and static server configuration |
| `.github/workflows/ci.yml` | Build and container smoke checks |

Generated files and local capture sessions are excluded from Git and Docker's build context.

## Run with Docker

```sh
docker build -t roboalarms-manual .
docker run --rm -p 127.0.0.1:8080:8080 roboalarms-manual
```

Open `http://127.0.0.1:8080`. The multi-stage image validates and builds the website, then serves the generated files using an unprivileged Nginx process on port **8080**. No runtime credentials or persistent storage are required.

For Dokploy, use branch `main`, repository-root build context, build type **Dockerfile**, and container port **8080**. See [Deployment](docs/deployment.md) for exact settings, domain configuration, and automatic deployments.

## Contribute

See [CONTRIBUTING.md](CONTRIBUTING.md) for content conventions and validation, and [UPDATING.md](UPDATING.md) for edition and screenshot maintenance. Report documentation errors through [GitHub issues](https://github.com/RoboAlarms/documentation/issues); include the page and relevant software version.

Use fictional examples in contributions. Keep installation credentials, authentication sessions, personal identifiers, and private network details out of text and images.

## License

Licensed under [Apache-2.0](LICENSE), retaining attribution to the upstream RoboAlarms Panel authors. See [NOTICE](NOTICE) and [licenses/](licenses/) for third-party notices associated with the screenshots.
