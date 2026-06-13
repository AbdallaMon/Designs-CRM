# 08 — UI Restore Plan (master's exact UI → /v2 backend)

> **Decided 2026-06-13.** Supersedes the redesign/"map-all-onto-v2-reimplementation" direction for the
> frontend. Backend is untouched (frozen, mounts `/v2`). This is a **frontend-only** restore + rewire.

## Goal (user's words, 2026-06-13)

Bring **master's EXACT UI** onto `server-migration`, remove the current reimplemented v2 FE, **reorganize
the code into feature/components**, and **rewire only the backend-calling code** so it talks to the
migrated `/v2` backend. **No visual/UX changes.** **No `/v2` in frontend URLs** — keep master's direct
`/dashboard/*` slugs. Bilingual ar/en stays (master's UI is already bilingual).

## Ground truth

- `web/` today = the slim **v2 reimplementation** (5 `UiComponents` files, 2 helpers, 287 `v2/features`
  files, routes under `(v2-features)/v2/**`). This is the "old ui" the user wants **removed**.
- `master:ui/src/app` = the **rich UI** the user wants: **319** `UiComponents`, **12** helpers, **8**
  providers, fonts, and **102** role-slot pages under `(auth)/dashboard/(dashboard)/@{admin,super_admin,
  super_sales,staff,accountant,contact_initiator}/...` plus public `booking`/`contracts`/`image-session`/
  `chats`.
- Backend (`server/src`) mounts **only `/v2`**, `access_token`/`refresh_token` cookies, envelope
  `{success,message,data,translationKey}`, lists `{items,total,page,pageSize}`, `permissions[]`, workflow
  `/actions/*`, model-pick-list renames, self-scoped logs. Deltas catalogued in
  `RESUME-CHECKPOINT.md §5c`.

## Contract rewiring (master FE → /v2 backend)

Master's data layer (`helpers/functions/{getData,handleSubmit,getDataAndSet,uploadAsChunk}.js`,
`providers/AuthProvider.jsx`) uses `NEXT_PUBLIC_URL` (= `:4000`, no `/v2`) + legacy `token` cookie +
top-level `result.user`/raw arrays. Rewire centrally:

| Concern | Master (old) | Rewire to (/v2) |
|---|---|---|
| Base URL | `${NEXT_PUBLIC_URL}/${url}` | `${NEXT_PUBLIC_API}/${url}` (`:4000/v2`) |
| Auth check | `GET /auth/status` → `result.user` | `GET /v2/auth/me` → `result.data.user` (+ `permissions[]`) |
| Login | `POST /auth/login` → `response.user` | `POST /v2/auth/login` → `response.data.user` |
| Cookie | legacy `token`, `credentials:include` | `access_token`, `credentials:include` (server-set; FE just sends) |
| List shape | `result.data` array + `result.totalPages` | `result.data.items` + `result.data.{total,page,pageSize}` |
| Message | Arabic/English prose | language-neutral CODE → resolve to ar/en (port `web/v2/lib/messages/resolveMessage`) |
| Per-screen `url` | legacy paths (`admin/...`,`client/...`,`shared/...`) | `/v2/<module>/...` — **harvest from `web/v2/features/<x>/config` before deleting** |

`getData`/`useDataFetcher` and `handleRequestSubmit` are the two central choke points — fix the envelope/
pagination there once, then per-feature only the `url` strings + body/param deltas change.

## Execution

**Phase F0 — Foundation (do first, one commit):**
1. Bring master verbatim: `UiComponents/`, `helpers/`, `providers/`, `fonts/`, root `layout.js`,
   `globals.css`, `page.js`. (Replaces web's slim versions.)
2. Rewire central data layer to the /v2 contract (table above): `getData`, `handleSubmit`,
   `getDataAndSet`, `AuthProvider`, `uploadAsChunk`, login/reset `data.js`, socket base. Port the
   ar/en message resolver from `web/v2/lib/messages`.
3. Add any missing deps to `web/package.json` (react-icons, etc.).
4. Bring the `(auth)/dashboard` layout + login; get **boot + login + auth/me + one landing page** green.
5. `npm run build:web` clean → commit.

**Phase F1..Fn — feature by feature (collapse roles, rewire endpoints, commit per feature):**
For each feature, **collapse the per-role @slot pages into one shared feature component** at a direct
`/dashboard/<slug>` route, permission-gated (`permissions[]`/`capabilities.*`), rendering exactly what
master rendered for each role. Harvest the correct `/v2` endpoint map from the matching
`web/v2/features/<x>` config/service, apply §5c deltas, build, commit, then delete that feature's
`web/v2` reimplementation.

Suggested order (high-traffic first): leads/deals → projects/tasks/work-stages → accounting/payments →
calendar → contracts → image-sessions → dashboard widgets → notifications → users → website-utilities →
courses → questions/sales-stages/reviews → chat → public surfaces (booking/contracts-sign/client-image-session/chats).

**Phase Fz — cleanup:** remove the now-empty `web/v2/**` + `(v2-features)/**`; final build; update docs.

## Rules

- **No visual change** — pixel-identical to master per role; only code structure + data layer change.
- Keep bilingual ar/en (`keep-bilingual-decision`); English LTR must mirror.
- Frontend URLs = master's `/dashboard/*` slugs; **API base stays `/v2`**.
- Preserve master's role gating exactly (collapse ≠ widen access). Gate on real `permissions[]`.
- Orchestrator runs all git; build agents never run git.

---

## CHECKPOINT — 2026-06-13 (tag: `ui-restore-v2-endpoints`)

**Where we are.** `web/` is master's EXACT UI, wired to the migrated `/v2` backend, with the
endpoint rewiring done centrally. Return to this point with: `git checkout ui-restore-v2-endpoints`.

Session commits (on `server-migration`, after `2e6d9bf`):
1. `794fd7f` — foundation: master libs verbatim + data layer rewired to /v2 (apiClient: base,
   cookie, 401-refresh, envelope→flat normalizer; getData/getDataAndSet/handleSubmit/AuthProvider).
2. `341ac67` — ALL of master's UI verbatim (102 dashboard pages, 8 @role slots) + removed the
   321-file v2 reimplementation + `(v2-features)`; relocated the Arabic message resolver to
   `helpers/messages/`.
3. `9a2cd31` — master's public surfaces (booking, chats, contracts, image-session).
4. `82f2505` — central legacy→/v2 path adapter (`helpers/functions/apiPathMap.js`); 232/233 roots
   validated.
5. `55872bb` — workflow-action + direct-fetch deltas (contracts /actions, accounting payment
   /actions, NotificationIcon, SearchComponent, uploadAsChunk).

Build: `npm run build:web` green. Routes = master exactly, **zero `/v2` URLs**.

### ✅ Done
- Master's exact UI restored (no visual change). All pages present at master's `/dashboard/*`
  + public slugs. v2 reimplementation gone from `web`.
- Data layer matches the `/v2` backend (envelope, pagination, cookie, refresh, message codes).
- Endpoint rewiring: central adapter (bulk) + targeted workflow/direct-fetch deltas.

### ❌ NOT done yet
- **Code reorganization into feature components is NOT done.** The code is master's EXACT structure
  — the `@role` parallel-route slots are still separate (thin `@admin/leads`, `@staff/leads`, … each
  importing the shared `UiComponents` page). Collapsing those slots into single permission-gated
  feature pages is the SEPARATE, still-pending "reorganize" phase (visual output would stay identical).
- **Runtime verification** (needs login creds) — only build-verified + statically validated so far.
- Open endpoint gaps (see `55872bb` commit msg): generic `DeleteModelButton` for non-Task models
  (backend gap), client image-session image DELETE `{token}` body, `work-stages/:id/cost` (no route),
  utilities model pick-list value renames.

### ▶️ Next options
(a) Runtime-verify + close the open endpoint gaps, or (b) start the code reorganization (collapse
`@role` slots → feature components), or (c) the backend work for the generic-delete gap.
