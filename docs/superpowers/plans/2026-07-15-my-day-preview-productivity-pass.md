# My Day + Deal Preview Productivity Pass — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the 4-phase spec `docs/superpowers/specs/2026-07-15-my-day-preview-productivity-pass-design.md` — truth fixes, new warning rules, the My Day morning ritual, and accountant/initiator coverage + digest — plus personal-vs-team labeling clarity.

**Architecture:** All signal logic stays in the pure engines (`lead.cockpit.js`, `lead.workstage-cockpit.js`, injected clock); Prisma only in repos; language-neutral message codes; additive API changes except the one documented contract change (next-touch enforcement on reminder-status updates).

**Tech Stack:** Express + Prisma (vitest), Next.js 16 + MUI v7 (`next build` is the FE gate; lint is broken repo-wide).

## Global Constraints

- PDF + contract legacy services frozen — read-only.
- Prisma ONLY in `*.repo.js`; business logic in usecases; routes wire middleware only.
- Message codes from `packages/shared/messages-codes/*`; FE English copy maps; never prose in errors.
- Profiles are the source of sales tier — never `isSuperSales`/`isPrimary`.
- Thresholds: `FIRST_TOUCH_WARN_HOURS=24`, `FIRST_TOUCH_CRIT_HOURS=48`, `OFFER_DECISION_DAYS=3`, `POOL_TOUCH_WARN_HOURS=4`, `POOL_TOUCH_CRIT_HOURS=24`, `DIGEST_CRON="0 8 * * *"`, `DIGEST_TZ="Asia/Dubai"`, `DIGEST_TOP_N=5`.
- Tests: `npx vitest run <path>` from repo root; FE: `cd web && npx next build`.
- Commit after each task (`Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`).

---

### Task A1: Engine truth fixes (payment overdue + health lastActivity/nextTouch)

**Files:**
- Modify: `server/src/modules/leads/lead/lead.repo.js` (COCKPIT_BUNDLE_SELECT: `paymentsNew` select gains `dueDate: true`)
- Modify: `server/src/modules/leads/lead/lead.cockpit.js`
- Test: `server/src/modules/leads/lead/__tests__/lead.cockpit.test.js`

**Interfaces produced:**
- `health.payment` gains `{ overdueCount: number, oldestOverdueDays: number|null }`.
- `health.lastActivityDays: number|null`, `health.nextTouch: { kind: "CALL"|"MEETING", at: ISOstring }|null`.
- `PAYMENT_OVERDUE` (critical) now = any `paymentsNew` row `status==="DUE" && dueDate < now`; params `{ count, overdueDays }`; emitted in the **contract-signals block** (survives FINALIZED) and by `computeAccountantActions`. Old `bundle.paymentStatus === "OVERDUE"` predicate deleted.
- `paymentHealth(contract, now)` signature gains `now`.

- [ ] Failing tests: overdue DUE+past dueDate → `PAYMENT_OVERDUE` critical with overdueDays for SALES **and** ACCOUNTANT profiles, incl. on a FINALIZED lead; DUE with null/future dueDate → only `PAYMENT_DUE`; `paymentStatus:"OVERDUE"` alone no longer fires; `health.payment.overdueCount/oldestOverdueDays`; `lastActivityDays` from `updatedAt`; `nextTouch` = earliest future IN_PROGRESS reminder across calls+meetings, null when none.
- [ ] Implement; run `npx vitest run server/src/modules/leads/lead` → all green (existing snapshot cases untouched).
- [ ] Commit `feat(leads/cockpit): real date-based PAYMENT_OVERDUE + lastActivity/nextTouch health`.

### Task A2: DealHealthBar truth chips

**Files:**
- Modify: `web/src/features/leads/cockpit/DealHealthBar.jsx`
- Modify: `web/src/features/leads/cockpit/config/cockpitActions.jsx` (PAYMENT_OVERDUE copy shows `overdueDays`/`count`)

Chip logic (replaces the `paymentStatus` chip):
```
no health.contract        → no payment chip
payment.overdueCount > 0  → error  "Payment overdue {oldestOverdueDays}d"
payment.hasDue            → warning "{outstandingCount} payment(s) due"
else                      → success "Payments on track"
```
Plus captions: "Last activity {lastActivityDays}d ago" (when != null) and "Next {call|meeting}: {local datetime}" (when `nextTouch`). `health.paymentStatus` stays in payload, unread.

- [ ] Implement; `cd web && npx next build` exit 0. Commit `feat(web/cockpit): payment chip from ContractPayment truth + activity/next-touch lines`.

### Task B1: FIRST_TOUCH_SLA + OFFER_AWAITING_DECISION rules

**Files:**
- Modify: `server/src/modules/leads/lead/lead.repo.js` (bundle select gains `assignedAt: true`, `createdAt: true`; `priceOffers: { select: { isAccepted: true, createdAt: true } }`)
- Modify: `server/src/modules/leads/lead/lead.cockpit.js`
- Test: `server/src/modules/leads/lead/__tests__/lead.cockpit.test.js`

**Interfaces produced:** exported `FIRST_TOUCH_WARN_HOURS=24`, `FIRST_TOUCH_CRIT_HOURS=48`, `OFFER_DECISION_DAYS=3`, `POOL_TOUCH_WARN_HOURS=4`, `POOL_TOUCH_CRIT_HOURS=24`, and pure `poolTouchSeverity(createdAt, now) → "critical"|"warning"|null` (used by Task D2).

Rules (inside the `!CLOSED_WON` funnel block, after LEAD_STALE):
```js
// FIRST_TOUCH_SLA — claimed but never contacted. Suppressed when LEAD_STALE fired (age covered).
const staleFired = actions.some((a) => a.type === "LEAD_STALE");
if (!staleFired && bundle.assignedAt != null && health.stageIndex < 0 &&
    ACTIVE_STATUSES.includes(status) &&
    !callReminders.some((c) => c.status === "DONE")) {
  const hoursSinceAssigned = Math.floor((now - toDate(bundle.assignedAt)) / MS_PER_HOUR);
  if (hoursSinceAssigned >= FIRST_TOUCH_WARN_HOURS) {
    actions.push(action("FIRST_TOUCH_SLA",
      hoursSinceAssigned >= FIRST_TOUCH_CRIT_HOURS ? "critical" : "warning",
      { hoursSinceAssigned },
      { kind: "OPEN_CALL", capability: "canAddCall", tabKey: "calls" }));
  }
}
// OFFER_AWAITING_DECISION — offer(s) sent, none accepted, aging.
const newestOffer = priceOffers.filter((p) => p.createdAt != null)
  .map((p) => toDate(p.createdAt)).sort((a, b) => b - a)[0];
if (newestOffer && !health.hasAcceptedPriceOffer && ACTIVE_STATUSES.includes(status)) {
  const daysSinceOffer = daysBetween(newestOffer, now);
  if (daysSinceOffer >= OFFER_DECISION_DAYS) {
    actions.push(action("OFFER_AWAITING_DECISION", "warning",
      { daysSinceOffer, offerCount: priceOffers.length },
      { kind: "GOTO_TAB", capability: null, tabKey: "priceOffers" }));
  }
}
```
(`MS_PER_HOUR` const added. Both rules count as "blocking" for ADVANCE_STAGE since they're pushed before the `hasBlocking` check.)

- [ ] Failing tests: boundaries 24h/48h; suppressed when LEAD_STALE fires; silent when a DONE call or any stage exists / not assigned / closed-won; offer 3-day boundary; silent when accepted; `poolTouchSeverity` 4h/24h/null.
- [ ] Implement; leads suite green. Commit `feat(leads/cockpit): FIRST_TOUCH_SLA + OFFER_AWAITING_DECISION rules`.

### Task B2: Designer triage + FE copy for new signals

**Files:**
- Modify: `server/src/modules/leads/lead/lead.workstage-cockpit.js` (fallback `WORK_STAGE_ASSIGNED_TO_YOU` severity `"warning"` → `"info"`)
- Test: `server/src/modules/leads/lead/__tests__/lead.workstage-cockpit.test.js` (update expectation)
- Modify: `web/src/features/leads/cockpit/config/cockpitActions.jsx` (entries: FIRST_TOUCH_SLA, OFFER_AWAITING_DECISION)
- Modify: `web/src/features/my-day/config/myDayCopy.jsx` (same two entries if the map doesn't inherit)
- Modify: `web/src/features/my-day/MyWorkQueue.jsx` — split items: any item whose min severity is `info` renders under an "On track" divider (collapsed `<Accordion>`/simple section below the urgent list).

- [ ] Tests green + build green. Commit `feat(my-day): designer triage — on-track divider + info fallback severity`.

### Task C1: Agenda (backend)

**Files:**
- Modify: `server/src/modules/my-day/my-day.repo.js` — `findTodaysAgendaForUser({ userId, now })`: CallReminder + MeetingReminder where `userId`, `status:"IN_PROGRESS"`, `time: { lt: endOfDay(now) }` (covers overdue past-days + today), select `id, time, reminderReason, clientLead { id, client { name } }`; cap 100.
- Modify: `server/src/modules/my-day/my-day.usecase.js` — `getMyDay` gains `agenda` (self path only, after the queue): map to `{ kind, id, leadId, clientName, time, overdue: time < now, reminderReason }`, sort `time asc`.
- Modify: `server/src/modules/my-day/my-day.dto.js` — `toQueue` passes through optional `agenda`.
- Test: `server/src/modules/my-day/__tests__/my-day.usecase.test.js`

- [ ] Failing tests: agenda merged+sorted, `overdue` flags, absent on `getQueueForTarget`; designers also get agenda? — **yes, same reads (their calls are rare but harmless)**.
- [ ] Implement; my-day suite green. Commit `feat(my-day): today's agenda (calls+meetings incl. overdue) on the personal queue`.

### Task C2: Agenda rail + counts header + card health (frontend)

**Files:**
- Modify: `server/src/modules/my-day/my-day.usecase.js` — LEAD items gain `health: { stageIndex, stageCount, contractLevel, levelsDone, levelsTotal, paymentFlag }` (`paymentFlag` = `"OVERDUE"` if `health.payment.overdueCount>0`, `"DUE"` if `hasDue`, `"OK"` if contract, else `null`) — computed from the engine health already in hand.
- Create: `web/src/features/my-day/AgendaRail.jsx` — time-ordered rows (icon per kind, time, clientName, reason, red "overdue" chip), actions: Done / Missed (opens Task C4 dialog), link to lead.
- Modify: `web/src/features/my-day/MyWorkQueue.jsx` — render `<AgendaRail>` above the queue (self mode only — when no `userId` prop); counts header `"N critical · N warning · N info"`; LEAD card mini strip: `Stage {stageIndex+1}/{stageCount}` or `Contract {contractLevel} ({levelsDone}/{levelsTotal})` + payment flag chip.
- Labeling clarity (user ask): My work header caption **"Your personal queue — only leads/stages assigned to you"**; Team tab caption **"Your team — people you supervise"** (in `MyDay.jsx`/`TeamLens.jsx`).

- [ ] Backend item-health test; build green. Commit `feat(web/my-day): agenda rail, counts header, card health, yours-vs-team labels`.

### Task C3: Next-touch enforcement (backend, documented contract change)

**Files:**
- Modify: `packages/shared/messages-codes/leads/leads.js` (or the module's codes file) — add `NEXT_TOUCH_REQUIRED`.
- Modify: `web/src/app/helpers/messages/maps/leadsMessages.js` — English copy: "Schedule the next call/meeting or record why no follow-up is needed."
- Modify: `server/src/modules/leads/lead/lead.validation.js`:
```js
static reminderNext = z.object({
  type: z.enum(["CALL", "MEETING"]),
  time: z.union([z.string(), z.date()]),
  reason: z.string().optional(),
});
static reminderNoFollowUp = z.object({ reason: z.string().min(3) });
// updateCall / updateMeeting each gain: next: LeadValidation.reminderNext.optional(),
//                                       noFollowUp: LeadValidation.reminderNoFollowUp.optional(),
```
- Modify: `server/src/modules/leads/lead/lead.repo.js` — `hasOtherFutureTouch({ clientLeadId, excludeCallId?, excludeMeetingId?, now })` (any IN_PROGRESS call/meeting with `time >= now`, excluding the row being closed); `findCallReminderLead({ reminderId })` → `{ clientLeadId, lead: { status } }` (same for meeting).
- Modify: `server/src/modules/leads/lead/lead.sub-resources.usecase.js` — in BOTH `updateCallReminderStatus` / `updateMeetingReminderStatus`, after the ownership guard, when `status ∈ {DONE, MISSED}`:
```js
const { clientLeadId, leadStatus } = await leadRepository.findCallReminderLead({ reminderId });
const activeLead = ACTIVE_LEAD_SET.includes(leadStatus); // ["IN_PROGRESS","INTERESTED","NEEDS_IDENTIFIED","NEGOTIATING"]
if (activeLead) {
  const hasFuture = await leadRepository.hasOtherFutureTouch({ clientLeadId, excludeCallId: reminderId, now: new Date() });
  if (!hasFuture && !next && !noFollowUp) {
    throw new AppError(leadsMessagesCodes.NEXT_TOUCH_REQUIRED, 422, null, { reason: "closing the last touchpoint on an active lead" });
  }
}
// after the status update: if next → createCallReminder/createMeetingReminder (reuses time-in-future validation);
// if noFollowUp → createNote({ clientLeadId, userId: currentUser.id, content: `No follow-up planned: ${noFollowUp.reason}` })
```
(Sequential repo calls following the file's existing style; the pre-check makes a half-applied state impossible for the 422 path.)
- Modify: `server/src/modules/leads/lead/lead.controller.js` — pass `next`/`noFollowUp` through.
- Test: `server/src/modules/leads/lead/__tests__/` — enforcement matrix: last-touch DONE w/o fields → 422; with `next` → reminder created; with `noFollowUp` → note created; non-active lead exempt; another future touch exists → exempt; MISSED behaves like DONE; non-final touch update unchanged.
- Verification step: `grep -rn "call-reminders/" web/src server/src` — confirm every caller updated / no external caller breaks.

- [ ] Tests green. Commit `feat(leads): require next touchpoint (or explicit no-follow-up) when closing the last touch — NEXT_TOUCH_REQUIRED 422`.

### Task C4: Outcome dialog (frontend)

**Files:**
- Create: `web/src/features/leads/widgets/OutcomeNextTouchDialog.jsx` — outcome text field + segmented choice \[Schedule call | Schedule meeting | No follow-up\] (datetime picker for schedule; reason field for no-follow-up); submits the enriched PUT.
- Modify: the existing call/meeting status-update call sites (calls tab / meeting tab widgets + `AgendaRail`) to open this dialog for DONE/MISSED instead of bare status PUT; on 422 `NEXT_TOUCH_REQUIRED` the dialog highlights the required section.

- [ ] Build green; manual flow sanity via component wiring. Commit `feat(web/leads): outcome→next-touch dialog on call/meeting completion`.

### Task D1: Grants + nav for ACCOUNTANT + CONTACT_INITIATOR

**Files:**
- Modify: `packages/shared/constants/access/role-permissions.js` — ACCOUNTANT + CONTACT_INITIATOR gain `MY_DAY_PERSONAL` (`my_day.view`).
- Modify: `packages/shared/constants/access/profiles.js` — same for the two profiles' code sets.
- Modify: `packages/shared/constants/access/navigation.js` — `my-day` nav `allowedRoles` += `ACCOUNTANT`, `CONTACT_INITIATOR`.
- Modify: `docs/superpowers/specs/permissions-parity-matrix.md` — addendum: 2 additive grants (new surface, no data widening), the C3 contract change, the A2 chip truth fix.
- Test: shared access tests if present (`npx vitest run packages`).

- [ ] Commit `feat(shared): my_day.view for ACCOUNTANT + CONTACT_INITIATOR (+nav, parity addendum)`.

### Task D2: FINANCE + INITIATOR queue branches

**Files:**
- Modify: `server/src/modules/my-day/my-day.usecase.js` — family map gains `ACCOUNTANT→FINANCE`, `CONTACT_INITIATOR→INITIATOR`; `#queueFor` dispatches:
  - FINANCE: `myDayRepository.findLeadsWithDuePayments({ take: 50 })` (leads where active contract has any `paymentsNew.status="DUE"`, `orderBy updatedAt asc`) → batch `findCockpitBundle`-shaped read via `leadRepository.findCockpitBundlesByIds(ids)` (new thin repo method reusing `COCKPIT_BUNDLE_SELECT`) → `computeCockpit(..., { profileKey: "ACCOUNTANT" })` → LEAD items.
  - INITIATOR: own leads via the existing sales path **plus** pool items from `myDayRepository.unclaimedAgingLeads({ minHours: 0, take: 50 })` (reuse/extend the existing unclaimed read to hours) → each pool item `{ kind: "LEAD", leadId, clientName, status: "NEW", signals: [{ type: "POOL_FIRST_TOUCH", severity: poolTouchSeverity(createdAt, now), params: { hoursSincePool }, cta: { kind: "GOTO_TAB", capability: null, tabKey: null } }] }`, dropping null-severity (fresh) pool leads.
- Modify: `server/src/modules/my-day/my-day.repo.js` — the two reads above (Prisma only).
- Modify: `web/src/features/my-day/config/myDayCopy.jsx` — `POOL_FIRST_TOUCH` copy ("Unclaimed new lead waiting {hoursSincePool}h — claim and make first contact").
- Test: usecase dispatch tests (accountant gets payment-signal items; initiator gets pool + own; pool fresh <4h dropped); route integration: ACCOUNTANT + CONTACT_INITIATOR → `GET /v2/my-day` 200, `/team` still 403.

- [ ] Tests green. Commit `feat(my-day): accountant collections queue + contact-initiator first-touch queue`.

### Task D3: Morning digest

**Files:**
- Modify: `packages/db/prisma/schema.prisma` — `Notification_type` gains `MY_DAY_DIGEST` (additive; migration is **user-run**: `npm run db:migrate -- --name add_my_day_digest_notification_type` + `npm run db:generate`).
- Create: `server/src/infra/cron/my-day-digest.cron.js` — node-cron `"0 8 * * *"`, `{ timezone: "Asia/Dubai" }`; handler `runMyDayDigest({ now })` exported separately for tests: resolve recipients (repo: active users), for each compute `myDayUsecase.getMyDay`, skip empty, top `DIGEST_TOP_N=5`, send in-app (`notification.service.sendToUser`, type `MY_DAY_DIGEST`, link `/dashboard/my-day`) + email (existing mailer; subject "Your Dream Studio morning brief"; plain list of signal copy titles).
- Modify: `server/src/infra/cron/index.js` — register `startMyDayDigestCron()`.
- Recipient resolution: users whose active-profile permission set includes `my_day.view` via `getEffectivePermissions` (`@dms/shared`).
- Modify: `web/.../notifications` icon/color map — key `MY_DAY_DIGEST`.
- Test: `server/src/infra/cron/__tests__/my-day-digest.test.js` — unit: recipients filtered by permission, empty queue skipped, top-5 cap, senders called with type+link (usecase/senders mocked, clock injected).

- [ ] Tests green. Commit `feat(my-day): 08:00 Asia/Dubai personal digest (in-app + email)`.

### Task E: Whole-branch verify + docs

- [ ] `npx vitest run` (full suite) — green; `cd web && npx next build` — exit 0.
- [ ] Team-scoping verification (user ask): confirm integration tests assert admin→anyone drill-down, super-sales→sales-only (403 on designer), personal queue own-records-only; add any missing assertion.
- [ ] Update `PROJECT_STATE.md` (done entry) + spec status header → implemented.
- [ ] Commit `docs: productivity pass done — PROJECT_STATE + parity notes`.

## Self-review notes
- Spec §3–§6 all mapped (A1/A2, B1/B2, C1–C4, D1–D3); labeling-clarity user ask → C2; scoping verification → E.
- `poolTouchSeverity` defined in B1, consumed in D2 (name consistent).
- `findCockpitBundlesByIds` new name — only D2 uses it.
- The C3 pre-check pattern avoids transactional coupling while keeping the 422 path side-effect-free.
