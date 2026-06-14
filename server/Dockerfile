# Backend (Express) image for the monorepo (npm workspaces).
# Build context = repo ROOT.  In Coolify set:
#   Build Pack = Dockerfile · Dockerfile location = /server/Dockerfile · Base Directory = /
#   Ports Exposes = 5000
#
# Mirrors the reference project's server image, adapted for this repo:
#   - workspace pkg names are @dms/db / @dms/shared (not @my/*)
#   - server entry is index.js (which imports src/server.js); listens on PORT (default 5000)
#   - this server uses node-canvas, so cairo/pango build libs are installed here
#     (the reference put canvas only on the web image)
#   - no mysqldump/DB-backup feature here, so the MySQL client is NOT installed
FROM node:24-bookworm-slim

# System deps:
#  - ca-certificates  : TLS for outbound HTTPS (Google / SMTP / Telegram / Stripe …)
#  - python3/make/g++ : toolchain for native modules (bcrypt, canvas) when no prebuilt binary
#  - libcairo/pango/jpeg/gif/rsvg : node-canvas (`canvas`) runtime + build deps
# (sharp ships its own prebuilt libvips, so it needs nothing extra here.)
RUN apt-get update \
 && apt-get install -y --no-install-recommends \
      ca-certificates python3 make g++ \
      libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy the whole monorepo (build context = repo root; .dockerignore trims it).
COPY . .

# Install ONLY the backend workspaces — deliberately skips `web` so the frontend's
# deps aren't pulled into this image. `npm ci` against the committed root lockfile →
# deterministic, exact versions. (If the lockfile ever drifts, swap `ci` for `install`.)
RUN npm ci -w server -w @dms/db -w @dms/shared --include-workspace-root

# Generate the Prisma client at BUILD time (gitignored output; the server imports it
# at startup). `generate` needs NO DB connection. Uses the root db:generate script
# (prisma generate --schema packages/db/prisma/schema.prisma).
RUN npm run db:generate

ENV NODE_ENV=production
EXPOSE 5000

# Start the API from the server workspace dir so relative asset paths (the
# __dirname-relative PDF fonts under server/services/fonts) resolve correctly.
# `exec` → signals reach node directly for graceful shutdown.
# DB migrate/seed (db:deploy / db:seed) is run manually once after the first deploy.
CMD ["sh", "-c", "cd /app/server && exec node index.js"]
