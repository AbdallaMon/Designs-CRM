# Security, profile-only, and canonical-API cutover plan

**Design:** `docs/superpowers/specs/2026-07-29-security-profile-only-cutover-design.md`
**Status:** Complete — 2026-07-29

## Phase 1 — Fail-closed identity and critical authorization

- [x] Make active relational profiles mandatory in auth middleware/DTO/token payloads.
- [x] Remove boot backfill and all role/subrole/flag fallbacks from runtime shared code.
- [x] Grant all explicit permissions to admin-tier profiles.
- [x] Replace backend authorization branches and user-recipient queries with active
  profile attributes.
- [x] Add permission and object-scope enforcement to utility search and polymorphic notes.
- [x] Constrain compatibility deletion to allow-listed, object-scoped operations and
  remove client-defined cascades.

## Phase 2 — Request and upload contracts

- [x] Fix the accountant payment-level payload.
- [x] Add purpose-scoped public upload validation before multipart parsing.
- [x] Add short-lived public-lead upload capabilities.
- [x] Pass contract/image-session tokens from the public frontend.
- [x] Remove unscoped client-portal upload routes and secure internal PDF upload.

## Phase 3 — Canonical API and courses

- [x] Mount application routes at `/v2` only.
- [x] Remove the frontend old-path translator and convert callers to canonical paths.
- [x] Move course tests, notifications, search, and upload calls onto the shared request
  client.
- [x] Translate all `courses-web` UI strings to English.
- [x] Include `courses-web` in Vitest discovery.

## Phase 4 — Error and contract architecture

- [x] Convert expected raw domain errors to `AppError` codes and add one English resolver
  entry per code.
- [x] Move active contract CRUD/query data access from service files into the contract
  repository/usecase layers.
- [x] Keep PDF render implementations unchanged and verify adapted boundaries without
  editing render behavior.

## Phase 5 — Regression and handoff

- [x] Run focused authorization/request/upload/course/contract tests after each slice.
- [x] Run the full test suite, both frontend builds, and Prisma validation.
- [x] Run source gates for forbidden identity fields, compatibility API code, direct
  first-party fetches, and unexpected Arabic course UI strings.
- [x] Update `PROJECT_STATE.md` with completed work, verification evidence, and any
  deployment prerequisites.
