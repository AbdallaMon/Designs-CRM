# courses-web — Port & API-Fix (Phase 1) — Design

**Date:** 2026-07-17
**Branch context:** runs on top of the finished migration (`frontend-redesign` lineage).
**Scope:** **Phase 1 only.** Port the standalone LMS frontend (`github.com/AbdallaMon/Design-courses`) into this monorepo as a new `courses-web/` app and make every screen work against the **current `/v2` backend**. The internal reorg into `features/components/config` (to match `C:\coding\school-system\web`) is **Phase 2 and explicitly out of scope here.**

---

## 1. Background

- The Design-courses repo is a separate Next 16 / React 19 / MUI 7 app (95 source files) that was written against the **old `master` backend** (flat paths: `admin/courses/*`, `shared/courses/*`, `auth/*`, `shared/roles`, `client/upload`).
- The LMS **backend is already fully migrated** into this monorepo: `server/src/modules/courses/{admin-course,staff-course}`, mounted at `/v2/courses` and `/v2/staff-courses`. The route files preserved the legacy sub-paths 1:1 on purpose (including the `attampts` misspelling).
- `web/` already solved "old master UI → `/v2` backend" with a proven data layer: `apiClient` (base `/v2`, cookie auth, single-flight token refresh on 401, envelope normalization), `apiPathMap` (ordered legacy→`/v2` rewrite rules), `resolveMessage` (message CODE → English), and `uploadAsChunk` (repointed to `files/chunks`). Phase 1 reuses this same pattern inside `courses-web`.

### Non-goals (Phase 1)
- No internal folder/feature reorganization (that is Phase 2).
- No changes to `web/` internals or its 165 data-layer importers.
- No backend changes (the `/v2` courses API already exists and is frozen for parity).
- No new LMS features; behavior stays equivalent to the original courses site except where the backend contract forces a change.

---

## 2. Approach (chosen)

**New `courses-web/` npm workspace, self-contained.** Copy the 95 files in as-is, then reuse `web/`'s data-layer + theme *pattern* by bringing byte-identical copies of the needed foundation files into `courses-web` (so `web/` is untouched and APIs get fixed fast). When a future merge into `web/` is actually decided, that identical foundation is trivial to hoist into one shared location — that call is deferred, not made now.

Rejected alternatives (from brainstorming): a `@dms/ui` shared package now (over-engineered for Phase 1 per user), and repointing `web/` via shims (touches all of `web/`, out of scope).

---

## 3. Architecture

```
courses-web/                     # new npm workspace (added to root "workspaces")
  package.json                   # Next 16 / React 19 / MUI 7; own dev/start port
  next.config.mjs, jsconfig.json # jsconfig "@/*" -> src/* preserved
  .env.example                   # NEXT_PUBLIC_API, NEXT_PUBLIC_URL, NEXT_PUBLIC_WEB_URL
  src/app/
    (auth)/...                   # ported screens (structure UNCHANGED in Phase 1)
    UiComponents/... models/...  # ported as-is
    helpers/functions/           # data layer — REPLACED with web/'s proven versions:
      apiClient.js               #   copied from web/ (verbatim)
      apiPathMap.js              #   copied from web/ + course/auth/roles/upload rules ADDED
      getData.js, getDataAndSet.js, handleSubmit.js, uploadAsChunk.js  # web/'s versions
    helpers/messages/            # resolveMessage.js + coursesMessages/auth maps (from web/)
    helpers/colors.js            # copied from web/ (shared caramel theme) — byte-identical
    providers/MUIContext.jsx     # copied from web/ (same theme) — byte-identical
    providers/AuthProvider.jsx   # reworked: auth/me + redirect-to-web-login (see §5)
```

**Ports:** the original site used `4010` for `start`; keep a distinct dev port (e.g. `4011 dev` / `4010 start`) so it can run alongside `web/` (3001/3010) and `server`.

---

## 4. API remap (the core of Phase 1)

All calls flow through `apiClient.apiRequest` → `mapLegacyPathToV2` → `/v2`. Two mechanisms:

**(a) Path rewrites — added to `apiPathMap` RULES** (order matters; more specific first):

| Legacy path (courses site) | `/v2` target | Notes |
|---|---|---|
| `admin/courses/...` | `courses/...` | admin management surface |
| `shared/courses/...` | `staff-courses/...` | staff consumption surface |
| `auth/status` | `auth/me` | v2 "who am I" |
| `client/upload` / `utility/upload-chunk` | `files/client/chunks` / `files/chunks` | already handled by web/'s `uploadAsChunk`; reuse verbatim |
| `shared/roles` | *see §6 — profile-based, needs decision* | role-switcher; not a 1:1 path |

**(b) Contract changes handled at the call site (NOT in the path map):**

| Concern | Old | `/v2` |
|---|---|---|
| Response envelope | loose `{ ...fields }` | `{ success, message, data, translationKey }` — normalized by `apiClient` |
| Paginated lists | flat `{ data, total, totalPages }` | `data: { items, total, page, pageSize }` — unwrapped by `apiClient` |
| Toast message | raw `response.message` string | language-neutral CODE → `resolveMessage` (English); `coursesMessages` map already exists |
| Mark lesson complete | `PATCH /:courseId/lessons/:lessonId` | `POST /:courseId/lessons/:lessonId/actions/complete` |
| Password reset | `auth/reset`, `auth/reset/{token}` | `POST auth/request-password-reset`, `POST auth/reset-password` (different body shape) |
| Logout | `auth/logout` | `POST /v2/auth/logout` (exists) |

Because `apiClient` already normalizes the envelope + pagination back into the flat shape the ported components expect (`res.data` is the array, `res.status`, `res.message`), most list/detail screens need **no per-component change** beyond going through the new `getData`/`handleRequestSubmit`. The call sites that change are the handful with a real contract difference (lesson-complete, reset, and any raw-message toasts).

---

## 5. Auth model (Phase 1)

- **No login/reset UI is the entry path.** The user logs in on the **lead site (`web/`)**; `web/` gets a **button that opens `courses-web`** (`NEXT_PUBLIC_WEB_URL` ↔ courses URL). Cookies (`access_token`/`refresh_token`) are domain-scoped, not port-scoped, so the session carries across apps in dev (localhost:3001 → :4011) and prod (same domain).
- `AuthProvider` calls `auth/me` on load (via `apiClient`, which auto-refreshes on 401). If still unauthenticated → **redirect to `web/`'s login** (`NEXT_PUBLIC_WEB_URL`).
- The ported `(auth)/login` and `(auth)/reset` pages are **kept in the tree** (repointed to the v2 shapes) as a fallback/direct-access path, but are not the primary flow. Marking them dead-code-removal is a Phase-2 decision.
- Gating stays as the original site had it for Phase 1 (role/`user.role` checks from `auth/me`); a full `usePermission`/profile parity pass is **not** in scope.

---

## 6. Known gap: `shared/roles` (role switcher)

`UiComponents/buttons/UserRoles.jsx` calls `shared/roles` to list roles the current user can "sign in as", then sets `localStorage.role` and reloads. In `master` this was the sub-role switcher; in `/v2` that concept became **profiles** (`auth/me` returns available profiles; `POST auth/profile/switch` switches). There is no 1:1 `shared/roles` path.

**Recommended Phase-1 handling (to confirm in the plan):** drive the switcher from `auth/me`'s profile list + `auth/profile/switch`, OR hide the switcher in Phase 1 (it renders only for non-ADMIN users and is a convenience, not core LMS). Decision recorded at plan time; not a blocker for the rest of Phase 1.

---

## 7. Data flow (unchanged from original, new plumbing)

`component → getData / handleRequestSubmit → apiClient.apiRequest → mapLegacyPathToV2 → fetch(/v2, credentials:include) → 401? refresh+retry → normalizeEnvelope → flat shape → component`.

Uploads: `uploadInChunks → files/chunks | files/client/chunks` (verbatim from `web/`).

---

## 8. Error handling

- Transport/HTTP errors surface through the existing toast layer (`ToastUpdate` + react-toastify), unchanged.
- Envelope `message` CODEs resolve to English via `resolveMessage` + the `coursesMessages`/auth maps before display (no raw CODE shown to users).
- 401 → single-flight refresh → retry once → on failure, `AuthProvider` redirect to `web/` login.

---

## 9. Verification (Phase 1 "done")

1. `courses-web` builds (`next build`) — build is the source of truth (`web/` lint is known-broken; same stack).
2. With a valid session cookie from `web/`, each screen loads real data from `/v2`:
   - Admin: courses list/create/edit, lessons (+ videos/pdfs/links), homeworks, tests + questions (create/reorder/edit/delete), attempts (summary, per-user review, increase/decrease, answer approve), dashboard.
   - Staff: courses list, course detail + progress, lesson view + mark-complete (via `/actions/complete`), homework submit, tests (take attempt, submit answers, end attempt, view attempts).
3. No request 404s on an old path; no raw message CODE shown in a toast; pagination renders.
4. Unauthenticated load redirects to `web/` login; the `web/` launch button opens courses-web with the session intact.

---

## 10. Risks

- **Route-order collisions** in the backend are already handled server-side; the frontend only needs correct base paths. Low risk.
- **`shared/roles`** is the one unresolved contract (see §6) — isolated to one component.
- **Cookie domain in dev**: ports share cookies on `localhost`; confirm `SameSite`/domain settings during verification.
- **Message-code coverage**: if the courses site surfaces a CODE with no entry in `coursesMessages`, it must be added (parity with `web/`).
