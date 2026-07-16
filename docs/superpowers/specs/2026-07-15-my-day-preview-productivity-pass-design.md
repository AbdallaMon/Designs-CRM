# My Day + Deal Preview — productivity pass (Design)

**Date:** 2026-07-15 · **Branch:** `feat/audit-log-sales-admin` · **Status:** ✅ IMPLEMENTED 2026-07-16 (all 4 phases + contextual My Day strips on dashboard/deals/work-stages + yours-vs-team labels; plan `docs/superpowers/plans/2026-07-15-my-day-preview-productivity-pass.md`; suite 988/988 + next build green). User-run steps pending: `npm run db:migrate -- --name add_my_day_digest_notification_type` + `npm run db:generate` + re-run `node packages/db/prisma/seed.js`.
**Depends on:** [Deal Lifecycle Responsibility Model study](./2026-07-11-deal-lifecycle-responsibility-model-study.md), [Profile-Aware Deal Cockpit design](./2026-07-11-profile-aware-deal-cockpit-design.md), [My Day work-queue design](./2026-07-12-my-day-work-queue-design.md), [My Day actionable drill-down design](./2026-07-15-my-day-actionable-drilldown-design.md).

---

## 1. Problem

The two daily surfaces — the lead **preview cockpit** ([DealHealthBar.jsx](../../../web/src/features/leads/cockpit/DealHealthBar.jsx) + [SalesDealCockpit.jsx](../../../web/src/features/leads/cockpit/SalesDealCockpit.jsx)) and **My Day** ([features/my-day](../../../web/src/features/my-day)) — share one engine (`computeCockpit`) but still mislead or stay silent in specific, verified ways:

1. **"Payment: Pending" lies.** The chip renders `health.paymentStatus` = `ClientLead.paymentStatus`, a column app code never updates (only the Stripe client flow can set `FULLY_PAID`; study G2). The real truth (`ContractPayment`, already computed into `health.payment`) is ignored by the chip.
2. **No date-based payment overdue exists.** The engine's `PAYMENT_OVERDUE` rule reads the same dead column and can never fire; `ContractPayment.dueDate` is never consulted. An unpaid `DUE` payment looks identical at 1 and 60 days.
3. **Speed-to-lead is invisible per lead.** Nothing flags a claimed-but-never-contacted lead until the generic 5-day `LEAD_STALE`; the team lens flags unclaimed leads only after 2 days.
4. **"Offer sent, client deciding" is a black hole** — `NO_PRICE_OFFER` stops once an offer exists; offer aging is untracked (study P2 gap).
5. **Designer My Day is not a triage list** — `WORK_STAGE_ASSIGNED_TO_YOU` (warning) always fires as a fallback, so every active stage shows and real urgencies drown.
6. **The accountant has no My Day** although the engine's ACCOUNTANT ruleset (`DOWNPAYMENT_DUE`/`PAYMENT_DUE`) is implemented and dormant; the contact-initiator has none either.
7. **My Day shows exceptions, not the day**: no agenda of today's calls/meetings; queue cards discard the health block the backend already computed; nothing prevents closing a call without a next step (the root cause `NO_UPCOMING_TOUCH`/`LEAD_STALE` then have to detect after the fact).
8. Preview shows the negative "No upcoming touchpoint" but never the positive "Next call: Thu 2pm", nor "last activity Nd ago" — both derivable from the already-selected bundle.

## 2. Goals / non-goals

**Goals** — four independently shippable phases:
- **A. Truth fixes:** the preview's payment chip + a real date-based overdue rule + last-activity/next-touch lines.
- **B. Warning rules:** first-touch SLA (hours), offer-aging, designer triage grouping.
- **C. My Day ritual:** today's agenda rail, outcome→next-touch required flow, counts header, mini health on cards.
- **D. Coverage + digest:** accountant collections queue, contact-initiator first-touch queue, 08:00 personal digest (in-app + email).

**Non-goals (explicitly out):** snooze/dismiss (new table), sales targets/quotas (new table), team trend deltas (snapshots), staff Telegram push (no infra — Telegram is client-comms only), Arabic sales-stage label unification (master parity; cosmetic), new team-lens exception types (personal queues + drill-down cover the new rules; revisit after usage), auto-marking overdue reminders as `MISSED` (silent data mutation; rejected).

**Locked decisions (user-confirmed 2026-07-15):**
| # | Decision | Choice |
|---|---|---|
| D1 | Scope | All four packages, phased A→B→C→D |
| D2 | Next-touch enforcement | **Required with escape**: closing the last touchpoint on an active lead requires scheduling the next one OR an explicit "no follow-up" reason. Backend-enforced (422), FE dialog mirrors it |
| D3 | Digest audience | **Personal queues only** (`my_day.view` holders); supervisors/admins keep the live Team lens, no digest |

**Constraints:** no behavior change to frozen PDF/contract services; authorization stays profile + permission-code + object-scope; engine stays pure (clock injected); message codes language-neutral; additive API changes only — except the one documented contract change in D2.

## 3. Phase A — Truth fixes

### 3.1 Engine (`lead.cockpit.js`) + bundle (`lead.repo.js`)
- `COCKPIT_BUNDLE_SELECT.contracts.paymentsNew` gains `dueDate: true` (read-only; no schema change).
- `paymentHealth` (health.payment) gains `{ overdueCount, oldestOverdueDays }` — a payment is *overdue* iff `status === "DUE" && dueDate && dueDate < now`.
- **`PAYMENT_OVERDUE` is rewired, same type name** (existing FE copy keeps working): old predicate (`bundle.paymentStatus === "OVERDUE"`) deleted; new predicate = any overdue `ContractPayment` (params: `{ overdueDays, count }`), severity critical, emitted by **both SALES and ACCOUNTANT** rule sets (ADMIN inherits SALES). `PAYMENT_DUE` (warning) keeps firing for `DUE` rows that are not date-overdue (incl. `dueDate = null`).
- `computeHealth` gains:
  - `lastActivityDays` — whole days since `bundle.updatedAt`.
  - `nextTouch` — `{ kind: "CALL"|"MEETING", at }` from the earliest **future** `IN_PROGRESS` call/meeting reminder, else `null` (data already selected).

### 3.2 Frontend ([DealHealthBar.jsx](../../../web/src/features/leads/cockpit/DealHealthBar.jsx))
| Condition | Payment chip |
|---|---|
| `health.contract == null` | **no payment chip** (pre-contract the column was meaningless) |
| `payment.overdueCount > 0` | error — "Payment overdue {oldestOverdueDays}d" |
| `payment.hasDue` | warning — "{outstandingCount} payment(s) due" |
| else | success — "Payments on track" |

Plus two quiet caption lines: "Last activity {lastActivityDays}d ago" and, when `nextTouch` exists, "Next {call|meeting}: {formatted time}". `health.paymentStatus` stays in the payload (deprecated, unread by FE) — additive/back-compat.

**Parity note:** display-only truth fix; the misleading master chip is intentionally replaced (documented in the parity matrix addendum).

## 4. Phase B — Warning rules (pure engine, no schema change)

Bundle additions: `assignedAt: true`, `createdAt: true` (lead scalars); `priceOffers` select gains `createdAt: true`.

| Signal | Sev | Ruleset | Fires when | Params / CTA |
|---|---|---|---|---|
| `FIRST_TOUCH_SLA` | warning ≥ 24h, critical ≥ 48h | SALES | status ∈ `ACTIVE_STATUSES`, `assignedAt != null`, `stageIndex < 0` (no `INITIAL_CONTACT`), no `DONE` call reminder, hours since `assignedAt` ≥ threshold. **Suppressed when `LEAD_STALE` fires** (stale subsumes it — no double noise) | `{ hoursSinceAssigned }` · CTA → calls tab (`canAddCall`) |
| `OFFER_AWAITING_DECISION` | warning | SALES | status ∈ `ACTIVE_STATUSES`, offers exist, none `isAccepted`, newest `createdAt` ≥ `OFFER_DECISION_DAYS` (3) days old. Joins the funnel-rule suppression on closed-won | `{ daysSinceOffer, offerCount }` · CTA → priceOffers tab |

Constants co-located with `STALE_LEAD_DAYS` in `lead.cockpit.js`: `FIRST_TOUCH_WARN_HOURS = 24`, `FIRST_TOUCH_CRIT_HOURS = 48`, `OFFER_DECISION_DAYS = 3`.

**Designer triage:** `WORK_STAGE_ASSIGNED_TO_YOU` severity demoted `warning → info` in [lead.workstage-cockpit.js](../../../server/src/modules/leads/lead/lead.workstage-cockpit.js); [MyWorkQueue.jsx](../../../web/src/features/my-day/MyWorkQueue.jsx) renders info-only items under an "On track" divider (collapsed-by-default section) so `DELIVERY_OVERDUE`/`STAGE_DUE_SOON` stand alone. Side effect: the work-stage strip on the lead detail shows this signal in info-blue instead of amber — accepted, documented.

FE copy: new entries for the two types in [cockpitActions.jsx](../../../web/src/features/leads/cockpit/config/cockpitActions.jsx) (single-English map, per project rule) + mirrored in [myDayCopy.jsx](../../../web/src/features/my-day/config/myDayCopy.jsx) if needed.

## 5. Phase C — My Day morning ritual

### 5.1 Agenda (`GET /v2/my-day` gains `agenda[]`)
- New repo read in [my-day.repo.js](../../../server/src/modules/my-day/my-day.repo.js) (Prisma only): the **caller's** `CallReminder` + `MeetingReminder` rows with `status = IN_PROGRESS` and (`time` within the current server day **or** `time < now` — i.e. today's schedule plus anything already overdue), joined to `clientLead { id, client.name }`, ordered by `time asc`.
- Shape: `agenda: [{ kind: "CALL"|"MEETING", id, leadId, clientName, time, overdue, reminderReason }]`. Included **only** on the self endpoint (`GET /v2/my-day`), not on `/users/:userId` (supervisor drill-down stays exception-focused).
- FE: an "Today's agenda" rail above the queue in the My work tab — time-ordered rows (overdue rows red-flagged), each with **Done / Missed** inline actions (opening the §5.2 dialog) and a link to the lead. Empty state: "No calls or meetings scheduled today."

### 5.2 Outcome → next-touch flow (D2: required with escape)
- **Endpoints:** the existing `PUT /call-reminders/:id` ([lead.route.js:72-79](../../../server/src/modules/leads/lead/lead.route.js)) and its meeting twin. Zod `updateCall`/`updateMeeting` schemas gain **optional** fields:
  - `next: { type: "CALL"|"MEETING", time: ISO, reason?: string }`
  - `noFollowUp: { reason: string (min 3) }`
- **Usecase rule** (`lead.sub-resources.usecase.js` — needs DB state, so enforced here, not in Zod): when the update sets `DONE` or `MISSED`, **and** the lead's status ∈ `ACTIVE_STATUSES`, **and** after this update the lead would have **no future `IN_PROGRESS` call or meeting**, then the payload MUST carry `next` (creates the reminder atomically in the same `$transaction`) or `noFollowUp` (persists a lead `Note`: `No follow-up planned: <reason>`). Otherwise throw `AppError` **422 `NEXT_TOUCH_REQUIRED`** (new message code in `packages/shared/messages-codes`).
  - Exemptions: non-active lead statuses; updates that don't complete the last touchpoint; status changes other than DONE/MISSED.
- **FE:** one dialog for both surfaces (agenda rows + the existing calls/meetings tabs): outcome text + segmented \[Schedule call · Schedule meeting · No follow-up (reason)\]. Reuses the existing NewCallDialog/NewClientMeetingDialog form internals.
- **⚠️ Documented intentional contract change** (master allows silent closes). FE mirrored in the same phase. The plan includes a verification task that no other caller (the public booking site — it books via the calendar module — or any internal flow, e.g. telegram/automation) PUTs these endpoints without the new fields.

### 5.3 Queue polish
- Counts header over the queue: "N critical · N warnings · N info" (client-side from items).
- LEAD cards gain a compact health strip — the DTO ([my-day.dto.js](../../../server/src/modules/my-day/my-day.dto.js)) stops discarding the engine's health: per item add `health: { stageIndex, stageCount, contractLevel, levelsTotal, paymentFlag: "OVERDUE"|"DUE"|"OK"|null }` (no amounts — money-boundary discipline preserved).

## 6. Phase D — Coverage + digest

### 6.1 Accountant collections queue (additive access, no data widening)
- Grants: `my_day.view` added to the ACCOUNTANT profile ([profiles.js](../../../packages/shared/constants/access/profiles.js)), role-permissions, idempotent seed; `my-day` nav `allowedRoles` gains ACCOUNTANT ([navigation.js](../../../packages/shared/constants/access/navigation.js)). Accountants already hold **full lead read scope** (`FULL_SCOPE_ROLES`), so this adds a surface, not data — parity-matrix addendum entry.
- Usecase: FINANCE family branch in [my-day.usecase.js](../../../server/src/modules/my-day/my-day.usecase.js) — repo read: leads whose active contract has any `paymentsNew.status = "DUE"` (`orderBy updatedAt asc`, cap 50 like sales; final ordering by severity/oldest `dueDate` in the DTO); run `computeCockpit` with the ACCOUNTANT profile → the dormant ruleset (`DOWNPAYMENT_DUE`, `PAYMENT_DUE`, rewired `PAYMENT_OVERDUE`) lights up. Items reuse the LEAD item shape.

### 6.2 Contact-initiator first-touch queue (additive, no widening)
- Grants + nav as above for CONTACT_INITIATOR (they already read the unassigned NEW pool via lead read scope). Note: the usecase's family dispatch currently resolves CONTACT_INITIATOR to *unsupported* (403 `MY_DAY_PROFILE_UNSUPPORTED`) — it gains an explicit INITIATOR branch; likewise a FINANCE branch for §6.1.
- Queue = two parts: **(a)** their own claimed leads through the normal SALES engine path (their profile already maps to the SALES ruleset), **(b)** a pool section — unassigned `NEW` leads (existing unclaimed repo read, extended to expose age in **hours**) rendered as items with a single `POOL_FIRST_TOUCH` signal (warning ≥ `POOL_TOUCH_WARN_HOURS` 4, critical ≥ `POOL_TOUCH_CRIT_HOURS` 24). The hours→severity mapping is a small exported pure helper in `lead.cockpit.js` (clock-injected, unit-tested); CTA → open lead (claim CTA already exists there).

### 6.3 Morning digest (D3: personal queues only)
- New `my-day-digest.cron.js` registered in [infra/cron/index.js](../../../server/src/infra/cron/index.js) `startCron()` (single-instance via `RUN_CRON`, per locked workers-from-server rule): `0 8 * * *`, timezone `Asia/Dubai`.
- For each **active** user whose effective permissions include `my_day.view` (resolved via the existing profile→codes cache): compute their personal queue via the usecase; skip when empty; take top `DIGEST_TOP_N = 5`.
- Deliver: in-app notification (new type **`MY_DAY_DIGEST`** — one **additive enum value** on `Notification_type`; migration via `npm run db:migrate -- --name add_my_day_digest_notification_type` + `db:generate`, **user-run** like prior additive migrations) via `notification.service.sendToUser` + email via the existing mailer (subject "Your Dream Studio morning brief", top-5 list, link to `/dashboard/my-day`). FE notification icon/color map gains the new type key.
- Known caveat (accepted): a server restart exactly at fire time could double-send; same exposure as the existing crons.

## 7. Thresholds (all named, one place each)

| Constant | Default | Where |
|---|---|---|
| `FIRST_TOUCH_WARN_HOURS` / `FIRST_TOUCH_CRIT_HOURS` | 24 / 48 | `lead.cockpit.js` (beside `STALE_LEAD_DAYS`) |
| `OFFER_DECISION_DAYS` | 3 | `lead.cockpit.js` |
| `POOL_TOUCH_WARN_HOURS` / `POOL_TOUCH_CRIT_HOURS` | 4 / 24 | `lead.cockpit.js` |
| `DIGEST_CRON` / `DIGEST_TZ` / `DIGEST_TOP_N` | `0 8 * * *` / `Asia/Dubai` / 5 | digest cron module |

## 8. Testing

- **Pure rules (clock injected):** rewired `PAYMENT_OVERDUE` (dueDate boundaries; null dueDate stays `PAYMENT_DUE`; fires for SALES + ACCOUNTANT), `FIRST_TOUCH_SLA` (24/48h boundaries; suppressed by `LEAD_STALE`; silent when a DONE call or a stage exists), `OFFER_AWAITING_DECISION` (3-day boundary; silent when accepted/closed-won), pool hours→severity helper, `nextTouch`/`lastActivityDays` health fields, designer severity demotion.
- **Usecase:** next-touch enforcement matrix (last-touch DONE without `next`/`noFollowUp` → 422; with `next` → reminder created atomically; with `noFollowUp` → note persisted; non-active lead exempt; non-last touch exempt; MISSED same as DONE); agenda read (today + overdue, self-only); FINANCE + INITIATOR family dispatch; digest recipient resolution + empty-queue skip (cron handler tested as a unit, clock/mailer mocked).
- **Route integration (permission matrix):** accountant + initiator now 200 on `/v2/my-day`; everyone else unchanged (existing matrix stays green); drill-down scope rules untouched.
- **FE:** `cd web && npx next build` (repo lint is broken; build is the gate).
- **Parity:** addendum in `permissions-parity-matrix.md` — 2 additive grants + the D2 contract change + the chip truth fix.

## 9. Implementation order

1. **Phase A** — bundle `dueDate`, paymentHealth overdue, rewire `PAYMENT_OVERDUE`, health `lastActivityDays`/`nextTouch`, DealHealthBar chip + lines.
2. **Phase B** — bundle `assignedAt`/`createdAt`/offer `createdAt`, two new rules + suppression, designer demotion + FE "On track" divider, copy entries.
3. **Phase C** — agenda repo/usecase/DTO + rail; next-touch enforcement (validation + usecase + message code) + unified outcome dialog; counts header + card health strip.
4. **Phase D** — grants/nav/seed for ACCOUNTANT + CONTACT_INITIATOR; FINANCE + pool queue branches; digest cron + enum migration (user-run) + email/notification senders.

Each phase: subagent-driven TDD per repo convention, phase-scoped vitest + `next build`, then whole-branch verify at the end.

## 10. Risks & mitigations

| Risk | Mitigation |
|---|---|
| D2 breaks an unknown caller of the reminder-update endpoints | Dedicated plan task: grep all internal callers + confirm the public site doesn't touch them; FE ships in the same phase |
| `FIRST_TOUCH_SLA` floods old backlogs | It only fires when `LEAD_STALE` doesn't; both indicate genuinely untouched leads; thresholds tunable |
| Rewired `PAYMENT_OVERDUE` fires on legacy contracts with stale `dueDate` data | Severity ramp reads real rows; if noisy, the constant-gated grace period can be added in one place |
| Digest volume/annoyance | Empty queues skipped; top-5 cap; single morning send; audience limited to personal-queue holders (D3) |
| Accountant queue result set large | Same cap-50 + `truncated` contract as the sales queue |

## 11. Out of scope / future

Snooze/dismiss actions, sales targets, team trend deltas, staff Telegram push, team-lens exceptions for the new rules, Arabic label unification, auto-`MISSED` crons — each requires either a schema table, new infra, or a product decision; revisit after this pass ships.
