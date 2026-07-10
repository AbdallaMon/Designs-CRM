# Sales Deal Cockpit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Steps use `- [ ]`.

**Goal:** A next-best-action cockpit strip on the deal-detail screen, computed from real deal state, capability-gated, CTAs reuse existing dialogs.

**Architecture:** New read-only `GET /v2/leads/:clientLeadId/cockpit` backed by a pure `computeCockpit(bundle, now)` rules function + a single repo bundle query; a config-driven FE strip mounted under the deal header. No new mutation endpoints.

**Tech Stack:** Express 4, Prisma 6, Zod 4, `@dms/shared`, Next 16, MUI v7, `useLeadTab`/`useLeadDetails`, Vitest.

## Global Constraints

- Layering route→controller→usecase→repo→validation→dto; Prisma ONLY in `*.repo.js`; suffixes `*.route.js`/`*.repo.js`.
- Envelope `{ success, message, data, translationKey }`; `message` a language-neutral CODE; `AppError` for errors.
- Object-scope: the endpoint MUST use `requireSpecialChecker(checkIfUserCanAccessLead)` (IDOR guard).
- `computeCockpit` is PURE: no Prisma, no `Date.now()` inside — `now` is a parameter.
- Backend returns language-neutral `type`/`severity`/`params`; ALL human copy is English, resolved on the FE.
- Reuse `computeLeadCapabilities`; CTAs gated by `capabilities.*` — identical predicate to the tab actions.
- JS/ESM only. FE verify `cd web && npx next build`; BE verify `npx vitest run`.

---

### Task 1: Pure `computeCockpit` rules engine

**Files:**
- Create: `server/src/modules/leads/lead/lead.cockpit.js`
- Test: `server/src/modules/leads/lead/__tests__/lead.cockpit.test.js`

**Interfaces:**
- Produces: `computeCockpit(bundle, now) → { health, actions }` where `bundle = { status, paymentStatus, salesStages:[{stage}], callReminders:[{time,status}], meetingReminders:[{time,status,type}], priceOffers:[{isAccepted}], sessionQuestions:[{answer}], versaModels:[...], }`, `now` is a `Date`. `actions` sorted by severity (critical>warning>info) then rule order. Uses `SalesStageType` ordering from `@dms/shared` (or a local ordered array mirroring `salesStageEnum`, minus the synthetic NOT_INITIATED).

- [ ] **Step 1: Failing tests** — a table of bundles → expected action `type`s/order:
  - overdue call → `CALL_OVERDUE` critical first;
  - `paymentStatus:"OVERDUE"` → `PAYMENT_OVERDUE` critical;
  - no price offer + status INTERESTED → `NO_PRICE_OFFER` warning;
  - all reminders future + active status + stage complete → `ADVANCE_STAGE` info;
  - terminal status FINALIZED → no nagging actions, health only;
  - unanswered SPIN question early stage → `DISCOVERY_INCOMPLETE`;
  - health: currentStage/nextStage/stageIndex/stageCount correct for a given salesStages set.
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Implement the rules exactly per spec §3 table (each rule emits ≤1 action; terminal-status suppression; severity+order sort). Compute `health` (current = highest-index present stage; next = following; `NOT_INITIATED` when none).
- [ ] **Step 4:** Run → PASS. Commit `feat(leads): pure computeCockpit next-best-action engine`.

---

### Task 2: Repo bundle + usecase + dto

**Files:**
- Modify: `server/src/modules/leads/lead/lead.repo.js` (add `findCockpitBundle({clientLeadId})`)
- Create: `server/src/modules/leads/lead/lead.cockpit.usecase.js`
- Modify: `server/src/modules/leads/lead/lead.dto.js` (add `toCockpitDto`)
- Test: `server/src/modules/leads/lead/__tests__/lead.cockpit.usecase.test.js`

**Interfaces:**
- Consumes: `computeCockpit` (Task 1), `computeLeadCapabilities` (existing dto).
- Produces: `getLeadCockpit({ clientLeadId, authUser }) → { health, actions, capabilities }`.

- [ ] **Step 1: Failing usecase test** — mock the repo bundle; assert `getLeadCockpit` calls `computeCockpit`, attaches `capabilities` from `computeLeadCapabilities`, returns the dto shape. Mock `now` deterministically (inject via the usecase taking an optional `now = new Date()` param, or pass through — keep the pure fn testable).
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** `findCockpitBundle` — ONE Prisma query selecting the fields in spec §3 (status, paymentStatus, salesStages{stage}, callReminders{time,status}, meetingReminders{time,status,type}, priceOffers{isAccepted}, sessionQuestions{answer:{id}}, versaModels with steps/category, plus the fields `computeLeadCapabilities` needs — userId/accountantId/etc.). Prisma only here.
- [ ] **Step 4:** `lead.cockpit.usecase.js` — fetch bundle, `computeCockpit(bundle, now)`, `toCockpitDto`. `toCockpitDto` reuses `computeLeadCapabilities(record, authUser)`.
- [ ] **Step 5:** Run → PASS. Commit `feat(leads): cockpit repo bundle + usecase + dto`.

---

### Task 3: Route + controller + wiring + message code

**Files:**
- Modify: `server/src/modules/leads/lead/lead.controller.js` (add `getLeadCockpit`)
- Modify: `server/src/modules/leads/lead/lead.route.js` (add the route)
- Modify: `@dms/shared` messages-codes (add `LEAD_COCKPIT_FETCHED`) + the FE resolver map
- Test: integration `server/src/modules/leads/lead/__tests__/*cockpit*integration*` (or extend the leads integration test)

**Interfaces:**
- Consumes: `getLeadCockpit` (Task 2), `checkIfUserCanAccessLead` (existing).
- Produces: `GET /v2/leads/:clientLeadId/cockpit` → envelope with `message:"LEAD_COCKPIT_FETCHED"`.

- [ ] **Step 1: Failing integration test** — 403 for a non-owner sales user, 200 for owner/admin, `data` has `health`+`actions`+`capabilities`.
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Controller `getLeadCockpit` (thin, mirror `getLeadNotes`); route with `requirePermissions([P.LEAD.VIEW])` + `validate(clientLeadIdParams,"params")` + `requireSpecialChecker(checkIfUserCanAccessLead)`. Add `LEAD_COCKPIT_FETCHED` to messages-codes + English resolver.
- [ ] **Step 4:** Run → PASS. `npx vitest run` full green. Commit `feat(leads): GET /:id/cockpit endpoint`.

---

### Task 4: Frontend cockpit strip

**Files:**
- Create: `web/src/features/leads/cockpit/SalesDealCockpit.jsx`, `cockpit/DealHealthBar.jsx`, `cockpit/config/cockpitActions.jsx`
- Modify: `web/src/features/leads/PreviewLeadDialog.jsx` (mount the strip between header and workspace)
- Modify: `web/src/features/leads/context/LeadDetailsContext.jsx` (add `cockpit` to `TAB_ENDPOINTS`)

**Interfaces:**
- Consumes: `GET /v2/leads/:id/cockpit` via `useLeadTab("cockpit")`; existing dialogs (CallsDialog/NewMeetingDialog/PriceOffersDialog/AddPaymentDialog) + StatusMenu; `useLeadDetails().refetchCore/refetchTab`.

- [ ] **Step 1:** `cockpitActions.jsx` — map each `type` → `{ icon, severityColor, title(params), description(params), ctaLabel, ctaKind }` in English. `ctaKind` → which dialog/tab to open.
- [ ] **Step 2:** `DealHealthBar.jsx` — stage progress (index/count) + status/payment chips from `health`.
- [ ] **Step 3:** `SalesDealCockpit.jsx` — `useLeadTab("cockpit")`; render `DealHealthBar` + the prioritized action list; each action shows icon/title/description; render the CTA button only when `capabilities[action.cta.capability]`; wire CTA to open the matching existing dialog / switch section / open StatusMenu. On dialog success: `refetchTab("cockpit")` + `refetchCore()`. Empty `actions` → "all caught up" compact state.
- [ ] **Step 4:** Mount `<SalesDealCockpit/>` in `PreviewLeadDialog.jsx` `LeadContent` right after `<LeadDialogHeader/>`; add `cockpit` to `TAB_ENDPOINTS`.
- [ ] **Step 5:** `cd web && npx next build` exit 0. Commit `feat(web): sales deal cockpit strip`.

---

### Task 5: Review + verify

- [ ] `npx vitest run` green; `cd web && npx next build` exit 0.
- [ ] shared-reviewer (layering, envelope, capability gating, no Prisma outside repo, pure fn) + shared-security (object-scope on the new endpoint; no over-exposure in the bundle/dto). Fix criticals/should-fixes. Commit.

## Self-Review
- Spec §3 → Tasks 1,2,3 ✅; §4 → Task 4 ✅; §5 (audit reuse) → no work needed ✅; §6 → each task + Task 5 ✅.
- Types consistent: `computeCockpit(bundle, now)`, `findCockpitBundle`, `getLeadCockpit`, `toCockpitDto`, `LEAD_COCKPIT_FETCHED`, `capabilities.canAddCall/…`.
