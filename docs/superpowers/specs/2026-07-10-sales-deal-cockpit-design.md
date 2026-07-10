# Sales Deal Cockpit — Design

> Status: approved (user delegated full autonomy 2026-07-10). Build #2 of the
> Sales/Admin workstream (Audit ✅ → **Sales Deal Cockpit** → Admin Command Center).
> Baseline conventions: layered backend (route→controller→usecase→repo→validation→dto),
> `capabilities.*` gating, config-driven frontend, English UI, message CODES.

## 1. Problem

A salesperson opening a deal sees tabs/sections but no answer to "**what do I do next
on this deal?**". The signals exist but are scattered across separate tabs: the sales
stage progression (`SalesStage`), overdue calls/meetings (`CallReminder`/
`MeetingReminder`), whether a price offer was sent (`PriceOffers`), discovery
completeness (SPIN `SessionQuestion`/`Answer`), unhandled objections (VERSA
`VersaModel`), and lead `status`/`paymentStatus`. Nothing surfaces the single most
important next action.

## 2. Goal

A **next-best-action cockpit strip** at the top of the deal-detail screen (under the
header, above the workspace) that computes a **prioritized, deduplicated list of
suggested actions** from the deal's real state, each with a severity and a one-click CTA
that opens the existing action dialog — all **capability-gated** (identical predicate to
the tab actions) so a user only sees CTAs they may perform. Plus a compact **deal-health
summary** (current stage → next stage, progress, status/payment chips).

Non-goals: no new mutation endpoints (CTAs reuse existing dialogs/endpoints); no
cross-deal aggregation (that's the Admin Command Center); no ML/scoring — deterministic
rules only.

## 3. Backend — read-only cockpit endpoint

New endpoint, lazy (loaded on deal open), mirroring the per-tab read pattern:

```
GET /v2/leads/:clientLeadId/cockpit
  requirePermissions([P.LEAD.VIEW])
  validate(clientLeadIdParams, "params")
  requireSpecialChecker(checkIfUserCanAccessLead)   // object scope (IDOR guard)
  → leadController.getLeadCockpit → usecase.getLeadCockpit
```

**Files (keep focused — the lead usecase is already split):**
- `server/src/modules/leads/lead/lead.cockpit.usecase.js` — `getLeadCockpit({ clientLeadId, authUser })`: calls the repo bundle, calls the pure `computeCockpit`, attaches `capabilities`.
- `server/src/modules/leads/lead/lead.cockpit.js` — **pure** `computeCockpit(bundle, now)` → `{ health, actions }`. No Prisma, no Date.now() inside (takes `now`) → unit-testable.
- `server/src/modules/leads/lead/lead.repo.js` — add `findCockpitBundle({ clientLeadId })`: ONE query selecting the `ClientLead` with `status`, `paymentStatus`, `salesStages{stage}`, `callReminders{time,status}`, `meetingReminders{time,status,type}`, `priceOffers{isAccepted}`, `sessionQuestions{ answer{ id } }`, `versaModels{ category, vId/eId/rId/sId/aId step responses }`, `_count`. Prisma stays only here.
- `lead.controller.js` — thin `getLeadCockpit` (mirror `getLeadNotes`).
- `lead.route.js` — the route above (place among the `/:clientLeadId/...` reads).
- `lead.dto.js` — `toCockpitDto(computed, record, authUser)` reusing `computeLeadCapabilities`.
- `lead.validation.js` — reuse existing `clientLeadIdParams`.

**Response `data` shape (language-neutral — no prose; FE renders English):**
```jsonc
{
  "health": {
    "status": "NEGOTIATING",            // ClientLead_status
    "paymentStatus": "PARTIALLY_PAID",  // PaymentStatus
    "currentStage": "HANDLE_OBJECTIONS",// SalesStageType or null (NOT_INITIATED)
    "nextStage": "DEAL_CLOSED",         // SalesStageType or null
    "stageIndex": 7, "stageCount": 10,
    "hasAcceptedPriceOffer": false
  },
  "actions": [
    { "type": "CALL_OVERDUE", "severity": "critical",
      "params": { "count": 2, "mostOverdueAt": "2026-07-08T09:00:00Z", "overdueDays": 2 },
      "cta": { "kind": "OPEN_CALL", "capability": "canAddCall", "tabKey": "calls" } },
    { "type": "NO_PRICE_OFFER", "severity": "warning",
      "params": {}, "cta": { "kind": "OPEN_PRICE_OFFER", "capability": "canAddPriceOffer", "tabKey": "priceOffers" } }
    // ...
  ],
  "capabilities": { "canAddCall": true, "canAddMeeting": true, "canAddPriceOffer": false, "canChangeStatus": true, ... }
}
```

**Action rules (`computeCockpit`), each emits at most one action, ordered by severity
then rule priority:**
| type | condition | severity | cta.kind / capability |
|---|---|---|---|
| `CALL_OVERDUE` | any `CallReminder.status==="IN_PROGRESS" && time<now` | critical | OPEN_CALL / canAddCall |
| `MEETING_OVERDUE` | any `MeetingReminder.status==="IN_PROGRESS" && time<now` | critical | OPEN_MEETING / canAddMeeting |
| `PAYMENT_OVERDUE` | `paymentStatus==="OVERDUE"` | critical | OPEN_PAYMENT / canAddPayment |
| `DISCOVERY_INCOMPLETE` | has `sessionQuestions` with `answer==null` (and status ∈ early stages) | warning | GOTO_TAB(analysis) / (view) |
| `OBJECTION_UNHANDLED` | a `VersaModel` step has a question but empty `clientResponse`/`answer` | warning | GOTO_TAB(analysis) / (view) |
| `NO_PRICE_OFFER` | `priceOffers.length===0 && status ∈ {INTERESTED,NEEDS_IDENTIFIED,NEGOTIATING}` | warning | OPEN_PRICE_OFFER / canAddPriceOffer |
| `NO_UPCOMING_TOUCH` | no future call AND no future meeting AND status active | warning | OPEN_CALL / canAddCall |
| `ADVANCE_STAGE` | current stage complete, a next stage exists, no blocking action above | info | OPEN_STATUS / canChangeStatus |
| `AWAIT_SIGNATURE` | has price offer accepted, status not FINALIZED | info | GOTO_TAB(contracts) / (view) |
- Terminal statuses (`FINALIZED`, `CONVERTED`, `REJECTED`, `ARCHIVED`) → only an `info`
  "deal closed" summary, no nagging actions.
- An action whose `capability` the user lacks is still returned but the FE renders it
  read-only (no CTA) — the user sees the signal, only the button is gated. (Matches the
  "signal visible, action gated" principle from the audit review.)

## 4. Frontend — the cockpit strip

- `web/src/features/leads/cockpit/SalesDealCockpit.jsx` — the strip. Mounted in
  `web/src/features/leads/PreviewLeadDialog.jsx` `LeadContent`, **between
  `<LeadDialogHeader/>` and `<LeadWorkspace/>`** (inside `LeadDetailsProvider`).
- Data: add `cockpit` to `TAB_ENDPOINTS` in `context/LeadDetailsContext.jsx`
  (`(leadId) => shared/client-leads/${leadId}/cockpit`) and load via `useLeadTab("cockpit")`
  (lazy, cached, refetchable) — no bespoke fetching.
- `web/src/features/leads/cockpit/config/cockpitActions.jsx` — maps each `type` →
  `{ icon, severityColor, title(params), description(params), ctaLabel }` in **English**
  (the language-neutral→English resolution, consistent with the message-code pattern).
- `web/src/features/leads/cockpit/DealHealthBar.jsx` — the stage progress + status/
  payment chips from `health`.
- CTAs: reuse existing dialogs — `dialogs/CallsDialog.jsx`, `NewMeetingDialog.jsx`,
  `PriceOffersDialog.jsx`, `AddPaymentDialog`, and `StatusMenu` for `OPEN_STATUS`;
  `GOTO_TAB` switches the workspace section. Each mutation calls the tab's `onMutated`/
  `useLeadDetails().refetchCore()` AND `refetchTab("cockpit")` so the strip updates.
- Gating: each CTA renders only when `capabilities[action.cta.capability]` is true (the
  cockpit response carries `capabilities`); the `usePermission` layer already governs the
  underlying dialogs. English UI.
- Empty state: when `actions` is empty (healthy deal), show a compact "You're all caught
  up on this deal" state with just the health bar.

## 5. Audit integration

The CTAs reuse existing mutation endpoints, which (for status change, price offer, call)
now already emit audit events from Build #1 — so cockpit-driven actions are audited for
free. No new audit wiring needed here.

## 6. Testing & verification

- Unit (backend): `lead.cockpit.js` `computeCockpit(bundle, now)` — a table of bundles →
  expected `actions`/severity/order; terminal-status suppression; capability passthrough.
- Backend: `lead.cockpit.usecase` maps repo bundle → dto; object-scope checker denies
  cross-user access (reuses `checkIfUserCanAccessLead`, already tested).
- Integration: `GET /v2/leads/:id/cockpit` 403 for a non-owner sales user, 200 for owner/
  admin, envelope `{ success, message:"LEAD_COCKPIT_FETCHED", data, translationKey }`.
- Frontend: `cd web && npx next build` exit 0; the strip renders for a sample lead;
  CTAs gated by capabilities.
- Full suite `npx vitest run` green.

## 7. Files summary

Backend: `lead.cockpit.js` (pure), `lead.cockpit.usecase.js`, `lead.repo.js` (+method),
`lead.controller.js` (+getLeadCockpit), `lead.route.js` (+route), `lead.dto.js`
(+toCockpitDto), message code `LEAD_COCKPIT_FETCHED` in `@dms/shared` messages-codes.
Frontend: `cockpit/SalesDealCockpit.jsx`, `cockpit/DealHealthBar.jsx`,
`cockpit/config/cockpitActions.jsx`, mount edit in `PreviewLeadDialog.jsx`,
`TAB_ENDPOINTS` edit in `LeadDetailsContext.jsx`, English copy resolution.
