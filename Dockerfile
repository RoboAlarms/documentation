# syntax=docker/dockerfile:1
FROM node:24-bookworm-slim@sha256:d6aa754f16b3197301076f047b5def2f02ea1dbbc2ca920407d46d7ec7f87b20 AS build
WORKDIR /app
ENV ASTRO_TELEMETRY_DISABLED=1

RUN npm install --global pnpm@11.25.0
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY astro.config.mjs tsconfig.json image-manifest.json browser-image-manifest.json home-assistant-manifest.json ./
COPY src ./src
COPY public ./public
COPY scripts ./scripts
RUN pnpm validate

FROM nginxinc/nginx-unprivileged:stable-alpine@sha256:56b8272e43a0525f67aed68d1e0794a712d10e3e45a563e118e9a77c817e6f86 AS production
LABEL org.opencontainers.image.title="RoboAlarms Documentation" \
      org.opencontainers.image.description="RoboAlarms Documentation Site" \
      org.opencontainers.image.source="https://github.com/RoboAlarms/documentation" \
      org.opencontainers.image.licenses="Apache-2.0"

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
COPY LICENSE NOTICE /usr/share/doc/roboalarms-docs/
COPY licenses /usr/share/doc/roboalarms-docs/licenses

EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget --quiet --output-document=/dev/null http://127.0.0.1:8080/ || exit 1
