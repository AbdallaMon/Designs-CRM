# Frontend (Next.js 16) image for the monorepo (npm workspaces).
# Build context = repo ROOT.  In Coolify set:
#   Build Pack = Dockerfile · Dockerfile location = /web/Dockerfile · Base Directory = /
#   Ports Exposes = 3010
#
# Mirrors the reference project's web image, adapted for this repo:
#   - web has NO node-canvas and does not import @dms/shared, so it needs no native
#     system libs and installs only the `web` workspace
#   - `next start` serves on port 3010 (see web/package.json "start")
FROM node:24-bookworm-slim

WORKDIR /app

# Copy the whole monorepo (build context = repo root; .dockerignore trims it).
COPY . .

# Install ONLY the frontend workspace. Skips server/db/shared. `npm ci` against the
# committed root lockfile → deterministic (no dependency drift / duplicate stylis).
RUN npm ci -w web --include-workspace-root

# NEXT_PUBLIC_* are inlined into the client bundle at BUILD time, so they must be real
# ENV during `next build`. Coolify injects them as build ARGs — re-declare here and
# promote to ENV so the build sees them.
ARG NEXT_PUBLIC_API
ARG NEXT_PUBLIC_URL
ARG NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN
ARG NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN
ENV NEXT_PUBLIC_API=$NEXT_PUBLIC_API \
    NEXT_PUBLIC_URL=$NEXT_PUBLIC_URL \
    NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN=$NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN \
    NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN=$NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN

RUN npm run build -w web

ENV NODE_ENV=production
EXPOSE 3010

# `next start` from the web workspace dir (port 3010). exec → signals reach node.
CMD ["sh", "-c", "cd /app/web && exec npm run start"]
