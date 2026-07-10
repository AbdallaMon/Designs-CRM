# Action Audit Log — Design

> Status: approved (user delegated full autonomy 2026-07-10). Build #1 of the
> Sales/Admin workstream (Audit → Sales Deal Cockpit → Admin Command Center).
> Baseline conventions: this repo's layered backend (route→controller→usecase→repo→
> validation→dto), `@dms/shared` access model, config-driven frontend feature.

## 1. Problem

Admins/consultants have no who-did-what trail. The existing `AuthAuditLog` table is
**authorization-only** (profile switch/assign/remove): it has `actorUserId`,
`targetUserId`, `action`, `detail` — no module, no entity type/id, no deal scope, no
change diff. There is no way for an admin to answer "who changed this lead's price
offer?", "who marked this payment paid?", or "what did this user do today?".

## 2. Goal

A **rich, semantic, append-only** action audit trail that:
- records meaningful business actions as first-class events (actor, module, action
  code, entity type+id, deal scope, before→after diff),
- is written from **usecases** (semantic), non-blocking (never breaks the real op),
  never logs secrets,
- is viewable **only by ADMIN + SUPER_ADMIN** via a filterable, paginated, read-only
  screen and API,
- becomes the coverage floor every future Sales/Admin action writes into.

Non-goals (this build): auditing reads; retention/archival; per-lead activity tab
(deferred to the Admin Command Center build); editing/deleting audit rows.

## 3. Data model — `ActionAuditLog` (new table)

Leaves the frozen `AuthAuditLog` untouched. Added to `packages/db/prisma/schema.prisma`
via `prisma migrate dev` (**user runs the migration** — the agent env has no
`DATABASE_URL`; never touches prod).

```prisma
model ActionAuditLog {
  id           Int      @id @default(autoincrement())
  actorUserId  Int
  actorRole    String?  @db.VarChar(48)   // role/profile snapshot at action time
  module       String   @db.VarChar(48)   // "lead" | "contract" | "payment" | "project" | "user" | "auth" ...
  action       String   @db.VarChar(64)   // language-neutral code: LEAD_CALL_LOGGED, PRICE_OFFER_SENT ...
  entityType   String?  @db.VarChar(48)   // "ClientLead" | "Contract" | "Payment" ...
  entityId     Int?
  clientLeadId Int?                        // deal scope, so a whole deal's history can be filtered
  summary      String?  @db.VarChar(255)  // short language-neutral one-liner
  detail       Json?                       // { before, after, changed:[...] } — redacted
  ip           String?  @db.VarChar(64)
  createdAt    DateTime @default(now())

  @@index([actorUserId])
  @@index([entityType, entityId])
  @@index([clientLeadId])
  @@index([module, action])
  @@index([createdAt])
}
```

No relations added to `User`/`ClientLead` (keeps the change purely additive on the
frozen models; joins are done by id in the repo). Follows the repo's ID/JSON
conventions (`Int @id @default(autoincrement())`, `Json?`).

## 4. Recording mechanism (semantic, in usecases)

- **`packages/shared/constants/access/audit-actions.js`** — `AUDIT_ACTIONS` map of
  language-neutral action codes + `AUDIT_MODULES`, mirroring the message-code
  convention. Re-exported from `@dms/shared`.
- **`server/src/infra/audit/action-audit.repo.js`** — Prisma-only repository
  (`create`, `findMany`+`count` for the viewer). Prisma lives only in repos.
- **`server/src/infra/audit/record-action.js`** — `recordAction(ctx, event)` service
  the usecases call. `ctx` carries `{ actorUserId, actorRole, ip }` (derived from
  `req.auth`); `event` carries `{ module, action, entityType, entityId, clientLeadId,
  summary, before?, after?, detail? }`. Responsibilities:
  - compute the diff via `diffFields(before, after, allowedKeys?)` → `{ changed, before, after }` (only changed keys),
  - **redact** a deny-list of sensitive keys (`password`, `passwordHash`, `token`,
    `arToken`, `enToken`, `chatAccessToken`, `sessionString`, `apiHash`, `refresh*`, `access_token`),
  - **never throw**: wrapped so a logging failure is swallowed + `console.error`'d,
    the caller's transaction is unaffected (audit write is outside the business tx).
- **`server/src/infra/audit/diff-fields.js`** — the pure diff+redact helper (unit-tested).

The existing `authAuditRepository.record()` (profile switch/assign/remove) is extended
to ALSO mirror those 3 events into `ActionAuditLog` (module `"auth"`), so the admin
sees one unified trail. `AuthAuditLog` itself is unchanged (rollback-safe).

## 5. Backend module — `server/src/modules/audit/`

Standard six-file module, mounted at `/v2/audit-logs`.

- `audit.route.js` — `router.use(requireAuth)`; `GET /` guarded by
  `requirePermissions([P.AUDIT.LOG_VIEW])` + `validate(AuditValidation.listQuery,"query")`.
- `audit.validation.js` — Zod: `page`, `pageSize`, `actorUserId`, `module`, `action`,
  `entityType`, `entityId`, `clientLeadId`, `from`, `to` (all optional, safe-parsed).
- `audit.controller.js` — thin: coerce query → call usecase → respond via the
  `{ success, message, data, translationKey }` envelope.
- `audit.usecase.js` — build the filter, call repo `findMany`+`count`, map via dto.
- `audit.repo.js` — Prisma `findMany`/`count` with the filter + `orderBy createdAt desc`.
- `audit.dto.js` — shape each row for the client (+ resolve `actorUserId`→name via a
  batched user lookup in the usecase; no ciphertext/secret leakage).
- Response: paginated `{ items, total, page, pageSize }`.
- No create/update/delete endpoints — the trail is append-only from usecases.

## 6. Permissions wiring (`@dms/shared`)

- **`permissions.constants.js`**: add `AUDIT_PERMISSIONS = { LOG_VIEW: "audit.log.view" }`
  and `PERMISSIONS.AUDIT.LOG_VIEW`; include in `ALL_PERMISSIONS`.
- **`role-permissions.js`**: add `export const AUDIT_ADMIN = [P.AUDIT.LOG_VIEW]` and
  spread it into `ADMIN` + `SUPER_ADMIN` only (NOT SHARED_AUTHED, NOT super-sales —
  admin/super-admin only, per the user's requirement).
- **`profiles.js`**: add `P.AUDIT.LOG_VIEW` to the `ADMIN` + `SUPER_ADMIN` profile code
  sets (both `isAdminTier`).
- **`navigation.js`**: add a nav row `{ key: "audit-logs", label: "Audit Log",
  href: "/dashboard/audit-logs", icon: "FiActivity", allowedRoles: [R.ADMIN, R.SUPER_ADMIN] }`
  placed near Reports (admin cluster). Optional `NAVIGATION_PERMISSION_ACTIONS.audit`.
- Update the affected `packages/shared/__tests__` (permissions/navigation/profiles)
  to assert admin-only visibility.

## 7. Frontend — `web/src/features/audit/`

Config-driven feature mirroring the existing list features (DataTable + `useRequest`
paginated + `PermissionGate`/route-guard).

- `web/src/app/(auth)/dashboard/(dashboard)/audit-logs/page.jsx` — the route, gated to
  ADMIN/SUPER_ADMIN (sidebar already hides it; RouteGuard enforces).
- `web/src/features/audit/config/` — column config (time, actor, module, action,
  entity, summary), filter config (actor, module, action, entity, deal, date range).
- `web/src/features/audit/AuditLogTable.jsx` — the paginated table.
- A detail drawer/dialog showing the before→after diff for a row.
- Data layer: a `service` pointing at `/v2/audit-logs`, consumed via the shared
  `useRequest`/`getData`.
- Message codes resolved through the existing English resolver.

## 8. Starter events wired now

To prove the pattern end-to-end and give the admin immediate signal, wire
`recordAction` into a representative set now (the rest follow as Sales/Admin build):
- auth: the 3 mirrored profile events (via the extended `authAuditRepository`),
- lead: create, status change, price-offer create, call logged,
- contract: create, payment marked paid,
- user: create, update, role change.

Each call is added inside the owning usecase, after the successful write, using the
already-loaded before/after objects.

## 9. Testing & verification

- Unit: `diffFields` (changed-keys + redaction), `audit.usecase` filter building,
  `audit.validation` safe-parse, `record-action` swallow-on-failure.
- Permission: `@dms/shared` tests assert `audit.log.view` is present for ADMIN/
  SUPER_ADMIN and absent for every other role/profile; navigation test asserts the
  Audit Log tab shows only for admin/super-admin.
- Integration (existing harness style): `GET /v2/audit-logs` returns 403 without the
  code, 200 + paginated envelope with it.
- Frontend: `cd web && npx next build` (lint is known-broken — build is the gate).
- Backend: `npm test` green.

## 10. Migration ownership

The schema edit + generated migration are authored by the agent; **the user runs**
`npm run db:migrate -- --name add_action_audit_log` then `npm run db:generate`, and
commits `schema.prisma` + the generated migration together (documented in the plan and
in `PROJECT_STATE.md` pending-migrations). Until then, backend tests run against the
mocked prisma seam (repo pattern), so the feature is fully buildable/verifiable offline
except the live DB apply.
