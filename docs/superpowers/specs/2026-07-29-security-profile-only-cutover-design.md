# Security, profile-only, and canonical-API cutover design

**Date:** 2026-07-29  
**Status:** Implemented and verified on 2026-07-29  
**Baseline:** `feat/workstage-flow-redesign`

## 1. Objective

Close the material audit findings without changing the production data model or the
frozen PDF rendering behavior. The result has one authorization identity, one API
surface, one request contract, and no runtime compatibility path.

## 2. Locked decisions

1. The active relational profile is the only authorization and presentation identity.
   Backend runtime code must not read `User.role`, `UserSubRole`, `isPrimary`, or
   `isSuperSales`, and it must not infer a profile from those fields.
2. A request without a valid active profile is denied. There is no role fallback and
   no boot-time role-to-profile backfill.
3. `ADMIN` and `SUPER_ADMIN` active profiles can perform every application action.
   They receive every explicit permission code and pass every object-scope checker.
   This is profile-driven, not a role or wildcard bypass.
4. `/v2` is the only application API prefix. The root compatibility mount and
   frontend path translator are removed.
5. Public file uploads require a verified, purpose-scoped token before multipart
   parsing:
   - contract uploads use the contract public token;
   - image-session uploads use the image-session token;
   - other existing public sessions use their own token;
   - a public lead form first obtains a short-lived signed upload capability.
6. Generic polymorphic notes may remain only with an explicit permission and
   object-scope resolution for the referenced record.
7. Generic arbitrary-model deletion is removed. Deletions use domain-owned,
   permission- and scope-checked endpoints.
8. Expected business failures are `AppError` message codes. Unexpected infrastructure
   and rendering failures remain internal errors.
9. Contract CRUD/data access moves to the module layers. Frozen PDF rendering files
   are not behaviorally edited.
10. `courses-web` uses the canonical API client and English UI, and is included in
    automated verification.
11. The Prisma schema and production database are unchanged.

## 3. Authorization boundary

Authentication resolves `currentProfileId` to an active profile cache entry. Tokens
may identify the user and active profile, but never contain a derived legacy role.
`authUser` exposes profile attributes (`currentProfileKey`, `profileFamily`,
`isAdminTier`, permissions) only.

Profileless, inactive-profile, and mismatched-profile requests fail closed. Profile
switching continues to verify membership and then changes `currentProfileId`.

Admin scope handling still loads the requested object when a controller needs
`req.scoped`; scope checkers therefore return the object for admin rather than being
globally skipped.

## 4. Public upload protocol

The public upload route accepts `purpose` and `token` as validated query parameters.
A special checker verifies the token against the purpose-specific owner before
`multer` writes a temporary file.

Supported persistent token sources are contract and image-session tokens, with
additional public-session token sources registered explicitly. Public lead uploads
use a rate-limited capability endpoint that signs `{ purpose, subject }` with a short
expiry and a dedicated JWT audience. The upload response remains the normal API
envelope.

The former unscoped client-portal upload endpoints are removed. Internal storage code
calls the storage provider directly instead of looping through an unauthenticated
HTTP endpoint.

## 5. API and frontend contract

All first-party clients build requests from one `/v2` base URL. Feature code supplies
canonical module paths and never old path aliases. Direct `fetch` is allowed only for
external services or browser-native asset retrieval, not application API calls.

Request bodies are aligned with strict backend Zod schemas. Course tests,
notifications, search, and uploads use the shared request layer so refresh, envelope
handling, and message-code resolution are uniform.

## 6. Contract module boundary

Non-rendering contract operations follow
`route → controller → usecase → contract.repo`. The usecase owns business rules and
transactions; the repository owns Prisma. PDF generation and its asset/font lookup
stay byte-for-byte unchanged. Any frozen service that needs data receives already
loaded data or calls a thin repository adapter without changing rendering logic.

## 7. Verification gates

- source scan: no backend runtime reads of legacy user identity fields;
- source scan: no first-party legacy path translator or root API mount;
- tests for profileless denial, explicit admin grants, scope denial, public upload
  tokens, accountant payload, course endpoints, and message-code errors;
- full Vitest suite, including `courses-web`;
- `web` and `courses-web` production builds;
- Prisma validation;
- targeted contract PDF golden/visual comparison if a frozen call boundary must be
  touched.
