# Work-stage Flow Redesign — Design

**Date:** 2026-07-16
**Status:** Approved (user), pending implementation plan
**Scope decision:** Full flow redesign — kanban card + preview + project-surface consolidation + lead↔project navigation + 2D board. The periodic health-check/notification scanner is explicitly **phase 2, out of scope here** (see §8).

## 1. Problem

The daily "work-stage board → project" flow is lead-centric and deep:

- Clicking **Preview** on a work-stage card opens a *lead* dialog (Details / Calls / Notes / Attachments); the actual **project** info (progress, status, tasks, deliveries, modifications) is buried inside the Details tab's "Related Projects" card. A designer opening their own card sees client data first, not their work.
- Reaching the real project page takes ~4 clicks (card → dialog → Details tab → "See the project #id" → page).
- The project UI is duplicated across **three near-identical surfaces** with divergent behavior per entry point: `ProjectDetails` embedded in the preview, standalone `ProjectPage` (`/dashboard/projects/[id]`), and `LeadProjects`.
- Role logic is mixed: backend `capabilities.*` (preferred) coexists with raw `user.role === "STAFF"` checks and `TODO(profiles)` gaps; preview tabs depend on fragile hardcoded indexes (flagged in code comments).
- The main `/dashboard/work-stages` page renders an **empty screen for 2D designers** (they only have per-stage pages).
- User-visible label typos: "Attatchments", "Modificaions".

Key current files:
`web/src/features/Kanban/work-stages/WorkStageKanbanCard.jsx`, `web/src/features/work-stages/PreviewWorkStage.jsx`, `web/src/features/leads/features/PreviewLead.jsx`, `web/src/features/work-stages/projects/{ProjectDetails,ProjectPage,LeadProjects}.jsx`, `web/src/app/(auth)/dashboard/(dashboard)/work-stages/page.jsx`, `server/src/modules/projects/project/{project.route,project.usecase,project.repo,project.dto}.js`.

## 2. Kanban card redesign

Replace the current card content with a compact triage layout (top → bottom):

1. **Header row:** client/lead name + project-type chip + **priority chip** (designer view) / **deal-value chip** (sales/admin-tier view only) + **unseen-updates dot** (corner).
2. **Next-action line (highlighted):** the single most urgent item — next open task or upcoming delivery, with due date. Becomes a red **Overdue** flag when the date is past. Delivery date remains visible as today.
3. **Progress bar + quick status menu:** explicit status-change control on the card (drag-and-drop stays); gated by `capabilities.canChangeStatus`.
4. **Footer:** **aging badge** ("In Study · 6d") — amber past ~4 days in-stage, red past ~7 (thresholds constants, tunable per stage type) — and **assignee avatar in sales/admin views only**.

**Removed from the card:** the scattered mini-modals and inline lists (`TaskPreviewModal`, `DesignersPreviewModal`, inline latest-tasks/modifications, `ProjectTasksDialog` trigger). All detail moves to the preview's Work tab. **No quick task actions on the card** (user decision).

**Unseen-updates dot (v1):** client-side — localStorage `lastOpenedAt` per lead/project key, compared against the card's latest activity timestamp from the payload. Per-device only; a per-user DB "seen" table is a possible later upgrade, not in scope.

## 3. Preview: per-role first tab + new Work tab

- Add a **"Work" tab** to the preview (`PreviewWorkStage`/`PreviewLead` content): project status + progress, tasks, delivery schedules, and modifications in one place, rendered by the consolidated project surface (§4).
- **Per-role opening tab (user decision):** designer/executor profiles open on **Work**; sales/super-sales/admin open on **lead Details** (today's behavior). Tab *availability* is unchanged — only the initial tab differs.
- Refactor tabs to **key-based** definitions (config array of `{key, label, render, visible}`) — removes the fragile index-4/index-5 coupling.
- Fix label typos ("Attachments", "Modifications").
- Dialog mechanics unchanged: MUI Dialog with fullscreen preference, plus the full-page variant at `/dashboard/work-stages/[id]` with `?tab=` persistence (now by key, not index).

## 4. One project surface

Consolidate the three duplicate surfaces into **one capability-driven `ProjectDetails` component** used by: the preview Work tab, `/dashboard/projects/[id]`, and `LeadProjects`.

- All action affordances driven by backend `capabilities.*` (`canEdit`, `canChangeStatus`, `canAssignDesigner`, `canAddTask`, `canAddDelivery`, …) from `project.dto.js` — remove the raw role checks / `isStaff` prop divergence and the related `TODO(profiles)` leftovers in these files.
- **Parity rule:** observable access must not widen beyond master. Where a raw role check today is *stricter* than capabilities, replicate it as a capability on the backend dto rather than dropping it.

## 5. Unified board for 2D designers

`/dashboard/work-stages/page.jsx` renders a real board for `TWO_D_DESIGNER`: their projects across Study / Final Plan / Modification / Quantity with a **stage-type tab/filter** (default **Study**; last selection remembered in localStorage). Per-stage pages remain. The main entry point is never blank.

## 6. Navigation shortcuts

- Card gets a direct **"Open project page"** action (1 click → `/dashboard/projects/:id`).
- Lead details "Projects" tab and the preview's Related Projects card link straight to the consolidated surface.
- Target: every lead↔project path reachable in 1–2 clicks.

## 7. Backend/data changes

### 7.1 Enriched board payload
`GET shared/projects/designers` (+ `/designers/columns`) dto gains per-card fields: `nextAction {type, title, dueDate, overdue}`, `timeInStageDays`, `priority`, `dealValue` (admin/sales-tier scoped — omitted otherwise), `assignee {id, name, avatar}` (admin/sales-tier scoped), `latestActivityAt` (for the unseen dot). Computation lives in the projects repo/dto; staleness thresholds shared as constants (reuse/align with the My Day detectors in `server/src/modules/my-day/my-day.repo.js` — do not duplicate threshold values).

### 7.2 `statusChangedAt` column (one additive migration)
`Project` has no per-status timestamp (`updatedAt` is any-write noise; `ActionAuditLog` is append-only/new and unreliable for backfill). Add nullable `Project.statusChangedAt DateTime?` via `prisma migrate dev` (additive, allowed by the frozen-schema rule §2.2 of CLAUDE.md since it goes through migrate dev):

- Written by every status-write path — `POST /designers/:leadId/actions/change-status` and any other usecase that mutates `Project.status` (sweep during implementation).
- Display fallback for old rows: `statusChangedAt ?? updatedAt`.

### 7.3 Scoping
All new payload fields respect existing lead/project object-scope checkers; deal value and assignee are attached only for admin-tier/sales profiles (profile-derived via `authUser.currentProfileKey` / `isAdminTier` — never the legacy flags).

## 8. Out of scope — phase 2: health-check notifications

A periodic scanner (cron) that pushes notifications about stale leads / overdue deliveries is deliberately deferred. Investigation confirmed it is ~70% pre-built: `infra/cron/` has 4 schedulers (reminders every minute, project-delivery 2-hourly, telegram, my-day digest daily), delivery channels exist (DB Notification + Socket.IO + email via `shared/notifications/notification.service.js`), and the problem detectors already live in the My Day module. The missing piece is a de-dup ledger ("already alerted" state). The aging badge (§2) covers the "what's stuck?" need passively; the push layer can be layered on later without rework.

## 9. Testing

- Backend: usecase/dto tests for the enriched card payload (scoped fields present/absent per profile), `statusChangedAt` written on every status path, threshold constants.
- Frontend: verify with `cd web && npx next build` (web lint is broken); route-level tests where the existing my-day/work-stage test patterns apply (per-role first tab, capability-gated actions).
- Parity: no access widening — re-check against the permissions parity matrix for the touched endpoints.
