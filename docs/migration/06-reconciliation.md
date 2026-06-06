# Reconciliation Report — Migration Plans 01–05

> **✅ ALL 10 open items below are now RESOLVED — see [`07-decisions-resolved.md`](07-decisions-resolved.md) for the authoritative resolutions (user-directed + best-practice). This report is retained for the reasoning/audit trail.**

> Cross-check of `docs/migration/{01..05}.md` for mutual consistency BEFORE implementation.
> Author: reconciliation review pass · Date: 2026-06-06 · Branch: `server-migration`
> Key claims verified against live code: `server/v2/modules/auth/auth.controller.js`, `server/v2/modules/leads/client/booking-lead/booking-leads.routes.js`, `server/v2/shared/http/response.js`.

**Verdict:** The three plans are broadly coherent and all faithful to the locked decisions (monorepo shape, frozen schema, PDF logic-freeze, drop-i18n-keep-codes, migrate-from-v2, workers-from-server). The substantive issues are: (a) the base-path/cutover handshake is under-specified across 03↔04; (b) three FE-required contract guarantees — pagination shape, per-record `capabilities.*`, and the booking-lead update/submit endpoints — are missing from or unlisted in 03's contract index; (c) FE/BE phase ordering for Leads is inverted; and (d) two real coverage gaps (client-app location, Drive subsystem). None are unrecoverable, but items 1–6 in the decisions list should be settled before implementation begins.

Findings are tagged **[BLOCKER] / [CONFLICT] / [GAP] / [MINOR] / [OK]**.

---

## 1. API contract alignment (03 §12 vs 04 §11)

- **[CONFLICT] Base path `/api/v1` (03) vs `/v2` (04).** 03 §1/§12 + the locked decision say the final base is `/api/v1/<plural-kebab>` with legacy/v2 prefixes aliased only during transition; 04 §11 pins the FE `ApiFetch` base to `/v2` and never schedules a base-path flip. **Reconcilable but under-specified.** Resolution: (a) 03 Phase 1 keeps a `/v2` alias mounted alongside `/api/v1` for the whole FE migration window, and (b) 04 adds an explicit step — the `ApiFetch` base flips `/v2`→`/api/v1` in one place at FE Phase 8, paired with 03 Phase 12 alias removal; the two phases are declared co-dependent.
- **[CONFLICT] Booking-lead endpoints missing from 03.** Code (`booking-leads.routes.js`) has `POST /`, `GET /:leadId`, `PATCH /:leadId`, `PUT /:leadId/submit`; 03 §12 lists only `POST` + `GET`. The `PATCH` (update draft) and `PUT /:leadId/submit` are absent. `submit` is effectively a workflow action (should arguably be `POST /:id/actions/submit`). Resolution: add both to 03 §12; decide preserve `PUT /submit` vs convert to `/actions/submit` and mirror in 04.
- **[GAP] Telegram + Files contracts vague on BOTH sides.** Neither 03 nor 04 pins telegram sub-paths or the chunked-upload contract. Resolution: enumerate in 03 §12 before those modules are built (already partly in v2 → discoverable now).
- **[OK] Core CRUD + workflow endpoints align** for leads, contracts, image-sessions, projects, tasks, payments, users, notes, reviews, dashboard, site, languages, reports — matching method families on both sides.
- **[MINOR] `PUT` vs `PATCH` mixed** across the two docs for the same update operations. Standardize one verb for full vs partial update; state once in 03 §12.

## 2. Response/envelope & message-codes (03 §5 vs 04 §4/§5 vs 02 §3)

- **[OK] Envelope shape agrees:** `{ success, message(CODE), data, translationKey }`; `message` always a language-neutral CODE.
- **[OK] Single shared namespace + FE mirroring agrees:** codes owned in `packages/shared/messages-codes/*`; FE mirrors resolution in `shared/data/messages.js` single-Arabic map.
- **[CONFLICT] Pagination shape.** 04 hard-requires `data:{items,total,page,pageSize}`; 03 names the keys in §5 but its overarching "preserve legacy shape unless flagged" principle does NOT list pagination normalization in the §12 CONTRACT CHANGES box. This IS a contract change (legacy lists differ). Resolution: add pagination-shape normalization as an explicit item in 03 §12 CONTRACT CHANGES.
- **[GAP] Success messages must become CODES too.** Verified `response.js ok()` defaults `message="OK"` and callers pass prose (`ok(res,{user},"Login successful")`), and the current envelope omits `translationKey`. Both plans assume success envelopes carry a CODE + translationKey. Resolution: 03 §5 must change `ok/created/...` helpers to require a code + namespace.

## 3. Permissions model (03 §6 vs 04 §6 vs 05 §8/§2)

- **[OK] Core model agrees:** permission codes (`dot.case`), `auth/me` returns `permissions[]` + `permissionsByModule{}`, `requirePermissions` guard, throwing object-scope checkers, FE `usePermission` + `config/permissions.js` mirror, capability-gated nav/page/action with the same predicate.
- **[GAP] Who EMITS `capabilities.*` is unspecified by 03.** 04 + 05 require per-record `capabilities.*` on list/detail payloads; 03 mentions capabilities as derived booleans but never states each module's dto/usecase must compute and attach them. Resolution: 03 adds a contract line — every scoped list/detail dto attaches a per-record `capabilities` object — and lists it in §12 CONTRACT CHANGES.
- **[CONFLICT, minor] Role→capability fallback during transition:** 05 + 04 plan for it; 03 never sanctions a fallback window. Resolution: decide the timeline — either `auth/me` emits real `permissions[]` from FE Phase 2 (no fallback needed) or 03 acknowledges the FE role-fallback shim. Tied to §6.
- **[MINOR] `isSuperSales`/`UserSubRole`:** 03 folds them into permission profiles; 05 still surfaces them in the role chip. Confirm `auth/me` still exposes display flags after the fold-in.

## 4. Status/workflow endpoints

- **[OK]** Both agree on `POST /:id/actions/<kebab>`, no generic PATCH on system-managed status.
- **[CONFLICT]** The one live exception: booking-lead `PUT /:leadId/submit` is a state-submit using `PUT`. Neither plan reconciles it (see §1). Resolution: grandfather or convert; state in both docs.

## 5. i18n consistency (04 §5 vs 05 vs locked decision)

- **[OK] 04 fully consistent with drop-i18n:** drop dictionary/toggle, keep RTL + message-code indirection resolving to a single Arabic map.
- **[OK→MINOR] 05 self-corrected** via its top synthesis note + Open Question #4 marked RESOLVED, but residual "i18n key" phrasing remains in the body. Net: the synthesis note governs; no real contradiction. When actioning 05, read every "i18n key" as "Arabic message-code key"; no language-toggle work.
- **[MINOR]** `<html lang="ar" dir="rtl">` agreement across 04, 05, and audit 01 — good.

## 6. Phase-ordering alignment (04 §7 vs 03 §3)

- **[CONFLICT] FE Phase 3 (Leads) lands BEFORE BE Phase 4 (Leads).** FE Leads needs `/v2/leads` paginated + scoped + `capabilities.*`, which BE doesn't deliver until BE Phase 4. Resolution: reorder FE Phase 3 to trail BE Phase 4, OR sanction the role-fallback shim (conflicts with "talk to v2"). Write per-phase BE dependencies into 04 §7.
- **[GAP] FE Phase 6 straddles three non-adjacent BE phases.** FE bundles Projects+Tasks+Payments+Accounting+Users, but BE delivers these across Phases 3 (users), 5 (projects/tasks), 8 (accounting). Resolution: split FE Phase 6 to match BE availability, or document FE Phase 6 cannot complete until BE Phase 8.
- **[OK] Foundation phases align:** FE Phase 0–2 map cleanly onto BE Phase 0–2; auth-first on both sides.

## 7. Naming/structure consistency

- **[OK] Package names agree** (`@dms/shared` / `@dms/db`); no `@my/*` reference leakage. (Recommend 04 explicitly name `@dms/shared` as the mirror source for `config/permissions.js`.)
- **[OK, intentional] `.repository.js` vs reference `.repo.js`:** 03 deliberately standardizes on `.repository.js` (matching existing v2), sanctioned by 02 §7. Ensure Phase 2 renames stragglers (`auth.repo.js`) and dedups `chat.repo.js`/`chat.repository.js`.
- **[CONFLICT] Workspace root list:** 03 Phase 0 writes `["packages/*","server","ui"]` (uses `ui`), but locked target + 02 say `web`. Resolution: state explicitly the root `package.json` workspaces entry transitions `"ui"`→`"web"` at FE Phase 8; 03 Phase 0's `"ui"` is intentionally temporary.
- **[OK] Frontend folder shape agrees** (`features/<x>` + `features/<x>Details`, `config/`, `shared/components`, `hooks/request`, `usePermission`).
- **[MINOR] Detail-feature naming:** 04 uses plural stem (`leadsDetails`); reference uses singular stem (`transactionDetails`). 04 is internally consistent; pick one convention.

## 8. Coverage gaps (audit 01 vs all plans)

- **[OK] Broken pdf worker** — covered (03 §8 fix #1 + Phase 2/7).
- **[OK] Dual-JWT shim removal** — covered (03 §6 + Phase 12). Verified `auth.controller.js` still writes legacy `"token"` cookie alongside new ones; 03's transitional dual-cookie shim matches.
- **[OK] Cron consolidation** — covered (03 §8 fix #4 folds the four standalone processes into `infra/cron` + server bootstrap with `RUN_WORKERS`/`RUN_CRON`).
- **[GAP] Client-facing app is a redirect stub** — only 05 addresses it (Open Question #3). 04 assumes a `(public)/` segment in this app but never resolves in-place vs separate deployment. Resolution: answer before FE Phase 5.
- **[GAP] Drive/file-tree subsystem** — `services/drive.js` + `DriveNode`/`DriveAcl`/`DrivePublicShare` (~7 models) have NO target module in 03 §2 and no feature in 04 §2. Resolution: confirm whether Drive is live; add module+feature if yes, mark removed if dead.
- **[GAP] Notification fan-out scheduled last (BE Phase 11)** while earlier modules (leads, contracts, sessions) trigger notifications. Resolution: 03 should state earlier modules call the legacy `services/notification.js` until Phase 11, or pull a minimal notification interface earlier.
- **[MINOR] Stray `console.log`** in live v2 (`auth.controller.js` lines 27/39; dashboard layout). Sweep during remediation.
- **[OK]** `postinstall` auto-run, font-path fragility, encryption-at-rest absence, oversized files — all covered in 03 §9/§7.

---

## Decisions needed before implementation (prioritized)

1. **Base-path cutover mechanism (§1).** Confirm `/v2` stays aliased alongside `/api/v1` for the whole FE window, and `ApiFetch` base flips `/v2`→`/api/v1` in one place at the joint BE-Phase-12 / FE-Phase-8 cutover.
2. **Pagination shape is a CONTRACT CHANGE (§2).** Approve adding `{items,total,page,pageSize}` normalization to 03 §12 CONTRACT CHANGES.
3. **`capabilities.*` ownership (§3).** Confirm every scoped list/detail dto computes and attaches per-record `capabilities.*`; add to 03 §12.
4. **Permission-availability timeline / role-fallback (§3, §6).** Decide: `auth/me` emits real `permissions[]` from FE Phase 2, OR sanction the FE role→capability fallback shim (added to 03).
5. **FE/BE phase re-sequencing (§6).** Resolve FE-Leads-before-BE-Leads; split FE Phase 6 to match BE Phases 3/5/8. Write per-phase BE dependencies into 04 §7.
6. **Booking-lead submit + the two missing endpoints (§1, §4).** Add `PATCH /:id` and the submit endpoint to 03 §12; decide `PUT /submit` (preserve) vs `POST /actions/submit` (convention).
7. **Client-facing app location (§8).** Answer 05 Open Question #3 — `(public)` in this app vs separate frontend. Blocks FE Phase 5.
8. **Drive/file-tree subsystem (§8).** Confirm live vs dead; add module+feature or mark removed.
9. **Root `package.json` workspaces `"ui"`→`"web"` transition (§7).** Confirm 03 Phase 0's `"ui"` is temporary and edited to `"web"` at FE Phase 8.
10. **Telegram/Files exact contracts (§1).** Enumerate telegram + chunked-upload endpoints in 03 §12 before those modules are built.
