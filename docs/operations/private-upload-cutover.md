# Private upload storage: production cutover runbook

This is the user-run procedure for moving the active document store out of both the repository and the public web root. It is intentionally copy-first: the old files and database backup remain available until the new deployment is verified.

## Final layout

For the current Docker/Coolify-style deployment, use one host directory:

```text
host:      /home/dreamstudiio-storage
container: /data
active:    /data/uploads
temporary: /data/uploads/temp
thumbs:    /data/uploads/thumb
```

Temporarily mount the old public directory read-only as:

```text
/home/dreamstudiio.com/public_html/uploads -> /legacy-uploads:ro
```

The only active store after cutover is `/home/dreamstudiio-storage`. The old directory is retained only as a rollback backup, is removed from the application container after verification, and must be denied by the old web server.

If the server runs directly on the host instead of inside a container, use `/home/dreamstudiio-storage`, `/home/dreamstudiio-storage/uploads`, and `/home/dreamstudiio.com/public_html/uploads` directly in the environment; no mounts are needed.

## 1. Before maintenance

1. Rotate the FTP credential that was previously exposed. FTP is no longer used by the code.
2. Take a full database backup and a filesystem snapshot/backup of the old upload directory.
3. Build the release from `feat/workstage-flow-redesign` and keep the old deployment available for rollback.
4. In Coolify persistent storage, add:
   - host `/home/dreamstudiio-storage` → container `/data`, read/write, permanent;
   - host `/home/dreamstudiio.com/public_html/uploads` → container `/legacy-uploads`, read-only, temporary.
5. Confirm the backend container UID/GID with `docker exec <backend-container> id`, then make the host directory writable by that UID/GID and inaccessible to unrelated users (directory mode `0750`; files normally `0640`). Do not use `0777`.
6. Put the old application into maintenance/read-only mode before the final copy so no upload can arrive between the copy and traffic switch.

Create the permanent directories on the same server after replacing `<uid>` and `<gid>` with the values reported by the backend container:

```bash
sudo install -d -m 0750 -o <uid> -g <gid> /home/dreamstudiio-storage
sudo install -d -m 0750 -o <uid> -g <gid> /home/dreamstudiio-storage/uploads
sudo install -d -m 0700 -o <uid> -g <gid> /home/dreamstudiio-storage/upload-migration-reports
```

Do not use FTP and do not manually drag the folder between domains. The migration script copies directly between the old and new host paths through the two mounts and verifies every file by SHA-256.

## 2. Production environment

`server/.env.production` is prepared for the container layout. Confirm the following values in the backend service environment:

```dotenv
NODE_ENV=production
ASSET_STORAGE_ROOT=/data
UPLOAD_DIR=/data/uploads
TEMP_UPLOAD_DIR=/data/uploads/temp
THUMBNAIL_DIR=/data/uploads/thumb
LEGACY_UPLOAD_DIR=/legacy-uploads
ASSET_DELIVERY_ORIGIN=https://eng-api.abdallaabdelsabour.com
IMAGE_DOMAIN=https://eng-crm.abdallaabdelsabour.com
ASSET_URL_TTL_SECONDS=3600
ASSET_EMAIL_URL_TTL_SECONDS=604800
ASSET_URL_MAX_TTL_SECONDS=604800
ASSET_CONTENT_RATE_LIMIT=3000
UPLOAD_LEGACY_ORIGINS=https://dreamstudiio.com,https://panel.dreamstudiio.com,https://eng-crm.abdallaabdelsabour.com,https://eng-api.abdallaabdelsabour.com
```

Required manual changes:

- Set `DATABASE_URL` to the imported `dream_studio_crm` database.
- Replace `ASSET_URL_SIGNING_SECRET` with a new independent secret of at least 32 characters. `openssl rand -hex 32` produces a suitable 64-character value. Never reuse a JWT, database, FTP, or integration key.
- Confirm `INTEGRATION_CREDENTIALS_MASTER_KEY` is the real production value and not an example placeholder.
- Confirm the public API/web origins match the deployed domains.
- Keep `BOOKING_ORIGIN` as the full booking-page base used by Stripe redirects (for example `https://dreamstudiio.com/register`); CORS and CSRF derive its origin safely.

After those changes, both checks must pass:

```bash
npm run env:check
npm run env:check:production
```

Build the external `eng-ahmed` booking/register app with `NEXT_PUBLIC_URL` set to the API base including `/v2`, for example `https://eng-api.abdallaabdelsabour.com/v2`. Its `source` payload still comes from `window.location.origin`, without `/register` or any slug.

The backend now fails at startup in production if the asset signing secret is missing, too short, or still starts with `REPLACE_`, or if the delivery origin is not HTTPS.

`IMAGE_DOMAIN` remains a compatibility fallback for non-canonical legacy reads. New documents do not use it: the backend reads `/uploads/...` from local storage, while API responses emit signed URLs under `ASSET_DELIVERY_ORIGIN`.

If Node runs directly on the host rather than in a container, replace only the five filesystem values with:

```dotenv
ASSET_STORAGE_ROOT=/home/dreamstudiio-storage
UPLOAD_DIR=/home/dreamstudiio-storage/uploads
TEMP_UPLOAD_DIR=/home/dreamstudiio-storage/uploads/temp
THUMBNAIL_DIR=/home/dreamstudiio-storage/uploads/thumb
LEGACY_UPLOAD_DIR=/home/dreamstudiio.com/public_html/uploads
```

## 3. Import and reconcile the database

Run these from the release checkout/container with `server/.env.production` present. Never run `migrate reset`, `migrate dev`, or `db push` against production.

1. Import the complete old database into `dream_studio_crm`.
2. Take another backup of that imported database.
3. Reconcile the imported production migration history:

   ```bash
   npm run db:status:production
   npm run db:resolve -- --dry-run
   npm run db:resolve
   npm run db:status:production
   ```

   The first status command records the pre-reconciliation state. Stop on a checksum mismatch or if the imported schema is not the expected old production schema. The dry-run lists the baseline migrations that will be recorded without executing their historical SQL.

4. Apply only committed production migrations and regenerate the client:

   ```bash
   npm run db:deploy:production
   npm run db:generate
   npm run db:status:production
   ```

   Stop if Prisma reports checksum mismatch, drift, or a destructive operation.

5. Seed the relational permission/profile catalog:

   ```bash
   npm run db:seed:production
   ```

6. Preview and then apply the legacy-user → relational-profile migration:

   ```bash
   npm run db:migrate:users
   npm run db:migrate:users -- --apply --backup-confirmed
   npm run db:migrate:users
   ```

   The last dry-run must report `usersMissingCurrentProfile: 0`. The migration only upserts `UserProfile` rows and sets `currentProfileId` when it is still null.

## 4. Copy and verify all files

The copy command walks every old subdirectory, refuses symlinks, never overwrites a different target file, preserves metadata, and verifies SHA-256 after every copy.

```bash
npm run uploads:copy
npm run uploads:copy -- --apply
npm run uploads:copy
```

Expected final dry-run:

- `pending: 0`
- `conflicts: []`
- `identical` equals the old file count

If there is a conflict, stop and inspect it. The script deliberately does not choose which copy wins.

## 5. Normalize database references

Copy files first so the normalization report can verify exact canonical references against `/data/uploads`.

1. Dry-run using only the configured trusted origins:

   ```bash
   npm run uploads:normalize -- --report=/data/upload-migration-reports/normalize-dry-run.json
   ```

2. Review the protected JSON report. Confirm every `before`/`after` pair is intended and every exact migrated file reports `fileExists: true`. If an old legitimate origin is missing, add that origin to `UPLOAD_LEGACY_ORIGINS` and rerun. Do not use `--allow-any-origin` unless the report is manually reviewed and the broader conversion is intentional.
3. Apply only after the database backup is confirmed:

   ```bash
   npm run uploads:normalize -- --apply --backup-confirmed --report=/data/upload-migration-reports/normalize-apply.json
   npm run uploads:normalize -- --report=/data/upload-migration-reports/normalize-verify.json
   ```

4. The verification run must report `changedFields: 0` and no failures/skipped candidate models.

The scanner derives all Prisma models dynamically and checks every scalar `String` and `Json` field, including nested JSON and embedded absolute upload URLs. Unrelated prose and external URLs are not changed.

## 6. Deploy and smoke-test before reopening traffic

Deploy/restart backend, CRM web, courses web, and the external booking/register page. Then verify:

1. Backend starts successfully and can create a test upload after a restart/redeploy; the file remains present under the host storage directory.
2. Direct API access to `/uploads/<key>` is `404`; only a valid signed `/v2/files/content/<key>?...` URL succeeds.
3. Changing the signature or waiting past expiry returns `401`.
4. Lead preview, notes, price offers, contract PDFs/signatures, image-session PDFs/images, and chat attachments render/download.
5. Contract and image-session PDF generation still succeeds and email/Telegram document links open during their configured lifetime.
6. A client image session works with its session token; the same catalog/image request without a valid session token or authorized admin cookie is denied.
7. Complete a public registration from `eng-ahmed` both in a clean browser and in a browser that already has CRM auth cookies. The uploaded reference saved in the database must start with `/uploads/`.
8. Reload the CRM after the new service worker activates. Browser DevTools must show no `dream-chat-media-*` Cache Storage; signed responses use `Cache-Control: private` and are not shared-cacheable.

Do not reopen traffic until these checks pass.

## 7. Remove the old public exposure

After the new signed route is proven:

1. Deny `/uploads/*` on the old `dreamstudiio.com` vhost (or disable that old vhost/static mapping entirely). Confirm a known old direct URL returns `403` or `404`.
2. Purge any CDN/reverse-proxy cache for the old `/uploads/*` path.
3. Remove the temporary `/legacy-uploads:ro` mount from the new backend, remove `LEGACY_UPLOAD_DIR`
   from the production environment, and restart it. This proves the app is using only `/data/uploads`.
   Direct-host/PM2 deployments likewise remove `LEGACY_UPLOAD_DIR` after the retired source has passed
   its final comparison; the running application does not read that migration-only variable.
4. Keep the old physical folder read-only for the agreed rollback retention period. It is a backup, not an active store. After backup retention and a final checksum/restore check, archive it outside `public_html` or delete it manually.

Existing browser caches cannot be remotely erased, but denying the old route and purging shared caches prevents new unauthenticated retrieval. New signed responses are private-cache only, and the service worker no longer stores chat/documents.

Typical deny rules (use the one matching the old web server):

```apache
# Apache 2.4, inside the old public_html/uploads/.htaccess
Require all denied
```

```nginx
# Nginx, inside the old dreamstudiio.com server block
location ^~ /uploads/ { return 404; }
```

The physical files do not need to move to `crm.dreamstudiio.com`, and no Next.js upload rewrite is required. The API domain serves time-limited signed responses from the external host directory; DNS names and disk location are independent.

## Rollback

Do not delete either backup during cutover. To roll back before new writes are accepted: restore the pre-normalization database backup, switch traffic to the old deployment, and re-enable the old upload route. If new uploads were accepted after cutover, first copy those new files back and reconcile the new database rows; a simple code rollback alone is not sufficient.
