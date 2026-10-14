# Deploy the manual with Dokploy

The site is pre-rendered during a Docker build. Production serves the resulting `dist/` files through unprivileged Nginx; Node.js and build dependencies are absent from the final image.

## Application settings

Create an application in Dokploy and configure:

| Setting | Value |
| --- | --- |
| Source | GitHub, `RoboAlarms/documentation` |
| Branch | `main` |
| Build path | `/` (repository root) |
| Build type | Dockerfile |
| Dockerfile path | `Dockerfile` |
| Docker context path | `.` (repository root) |
| Build stage | Leave empty to use the final stage |
| Domain | `docs.roboalarms.com` |
| Domain/container port | `8080` |
| Auto Deploy | Enabled for pushes to `main` |

Configure DNS and HTTPS in Dokploy's domain settings. The canonical site URL is set in `astro.config.mjs`; change it before deploying under another domain. The site expects to be served at `/`.

No environment variables, application secrets, persistent volumes, database, or exposed host port are required. Dokploy's proxy routes traffic to the container's port 8080. Keep GitHub integration credentials inside Dokploy.

Save the settings and deploy once. Configure the GitHub integration or webhook according to Dokploy's Auto Deploy instructions, then verify a later push triggers a deployment. CI validates builds but does not call the production deployment API. Dokploy can respond to a push independently of GitHub Actions; use review and passing checks before merging to `main`.

## Build and verify locally

```sh
docker build -t roboalarms-manual .
docker run --rm --name roboalarms-manual -p 127.0.0.1:8080:8080 roboalarms-manual
```

Visit the homepage and several guide pages. Verify images, production search, and a missing URL returning a 404 page. In another terminal, `docker inspect --format '{{.State.Health.Status}}' roboalarms-manual` reports the container's health. The Docker healthcheck requests the generated homepage.

## Serving behavior

Nginx listens on 8080 as a non-root user. Directory routes retain their trailing-slash behavior, redirects remain relative behind the proxy, and missing paths return the generated Astro 404 page with HTTP status 404.

HTML, screenshot URLs, and Pagefind search assets revalidate between deployments. Content-hashed files under `/_astro/` receive a long immutable cache lifetime. The server includes content-type and referrer-policy headers and gzip compression; HTTPS is terminated by Dokploy.

Docker base images are pinned by digest and pnpm is pinned by version. Update image digests intentionally and repeat the build and smoke checks to receive new runtime fixes. The committed pnpm lockfile is used with `--frozen-lockfile`.

## Design references

The layout follows [GitHub README guidance](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-readmes). The static build/runtime split follows [Astro's Docker recipe](https://docs.astro.build/en/recipes/docker/) and [Docker build practices](https://docs.docker.com/build/building/best-practices/). The runtime uses the [NGINX unprivileged image](https://github.com/nginx/docker-nginx-unprivileged).

For current Dokploy settings, see [build types](https://docs.dokploy.com/docs/core/applications/build-type), [domains](https://docs.dokploy.com/docs/core/domains), and [automatic deployment](https://docs.dokploy.com/docs/core/auto-deploy).
