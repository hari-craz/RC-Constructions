# syntax=docker/dockerfile:1.7

# Stage 1: Dependencies
FROM node:22.14-alpine3.21 AS deps
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.34.6 --activate

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Stage 2: Build
FROM node:22.14-alpine3.21 AS build
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.34.6 --activate

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG VITE_FORMSPREE_ID=""
ENV VITE_FORMSPREE_ID=${VITE_FORMSPREE_ID}

RUN pnpm build

# Stage 3: Runtime
FROM nginxinc/nginx-unprivileged:1.27-alpine AS runtime

LABEL org.opencontainers.image.title="RC Constructions" \
      org.opencontainers.image.description="Single-page scroll-driven architectural construction portfolio" \
      org.opencontainers.image.source="https://github.com/hari-craz/RC-Constructions" \
      org.opencontainers.image.licenses="UNLICENSED"

COPY --chown=nginx:nginx nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build --chown=nginx:nginx /app/dist /usr/share/nginx/html

EXPOSE 8080
USER 101

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:8080/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]
