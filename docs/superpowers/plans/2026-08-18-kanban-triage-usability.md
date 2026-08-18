# Kanban triage usability implementation plan

**Spec:** `docs/superpowers/specs/2026-08-18-kanban-triage-usability-design.md`  
**Checkpoint:** `fe900202`

## Constraints

- JavaScript only.
- Frontend-only; no endpoint, permission, schema, migration, database, or PDF changes.
- Preserve drag/drop, filters, bulk actions, preview routes, create-update behavior, and existing
  permission gates.
- Use existing MUI/theme tokens and the existing Updates modal.

## Task 1 — shared status navigator

- Create a compact `KanbanStatusNavigator` component.
- Add previous/next controls, clickable status pills, active-column tracking, smooth centering, and
  scroll snapping.
- Add `data-kanban-status` to columns and contextual empty-state text.
- Add helper/component tests.

## Task 2 — deal/project card signals

- Create pure helpers that select the most urgent open call and newest visible activity.
- Render a concise next-follow-up line with overdue/missing states.
- Render a one-line latest activity plus age badge.
- For contract-level cards, promote the active contract stage as Current work.
- Add helper and card tests.

## Task 3 — remove expanded card history

- Remove inline call-history boxes and project-detail grids from `KanbanLeadCard`.
- Refactor `KanbanUpdateSection` to show only the newest update summary.
- Keep Create Update and open full history through the existing `LeadListModal`.
- Make the history modal responsive and its trigger configurable.
- Add focused tests.

## Task 4 — Work Stage polish

- Keep existing task/delivery/progress/aging signals.
- Show an explicit neutral next-action state when no task/delivery is scheduled.
- Apply the shared compact update-history section.
- Extend Work Stage signal/card tests.

## Task 5 — verification and delivery

- Run focused Kanban, Image Session, update-section, and helper tests.
- Run the main web production build.
- Exercise Deals, All Projects, and Work Stage at desktop and mobile widths.
- Run scoped `git diff --check`.
- Update `PROJECT_STATE.md`.
- Create one separate Kanban redesign commit after checkpoint `fe900202`.

## Verification result

- **17/17 focused tests passed** across status navigation, deal/card signals, compact update history,
  Work Stage signals, and project-type presentation.
- Targeted lint passes for the new and changed Kanban/project-type code. The pre-existing
  `PreviewLead` data-loading effect remains a repository lint failure and was not changed by this work.
- Main web production build passed.
- Scoped `git diff --check` passed.
- Authenticated screenshot QA remains manual: the isolated test browser redirected to Login, and the
  signed-in Chrome session was unavailable to the automation bridge. No credentials or app data were used.
