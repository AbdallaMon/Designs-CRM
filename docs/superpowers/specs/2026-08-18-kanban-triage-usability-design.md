# Kanban triage usability redesign

**Date:** 2026-08-18  
**Status:** Implemented (authenticated screenshot QA remains manual)  
**Scope:** Current Deals, All Projects, and every Work Stage Kanban board.

## Goal

Raise all three Kanban experiences to a consistent, acceptable 8.5/10 by making horizontal
movement explicit and making each card answer one question: **what needs attention next?**
The change is frontend-only, additive to the existing UI behavior, and does not change routes,
permissions, object scope, APIs, database state, or PDF behavior.

## Safety checkpoint

The complete pre-redesign worktree is preserved in commit:

`fe900202 checkpoint: preserve current work before kanban UX redesign`

The Kanban redesign is implemented after that commit so it can be reverted independently.

## Roles and jobs

| Role | Why they are here | #1 job | How the UI makes it clear | What happens next |
|---|---|---|---|---|
| Normal / Primary Sales | Manage owned deals | Complete the next client follow-up | A highlighted Next line shows the nearest scheduled call or an overdue/missing follow-up | Open Calls or move the deal when the follow-up is complete |
| Super Sales / Admin tier | Monitor the whole pipeline | Find blocked or aging deals/projects | Status navigator, owner/value metadata, next-action and activity-aging signals | Open details, reassign, update, or move status |
| 2D / 3D Designer / Executor | Deliver assigned project work | Complete the next task or delivery | Existing task/delivery next-action, progress, aging, and task count remain primary | Open Work/details or move the stage |
| All Projects viewers | Monitor contracted work by level | Understand current contract work and recent progress | Contract stage is promoted; lead call history is not expanded in the card | Open project/lead details or update history |

## Information architecture

### Shared board navigation

1. Compact status navigator immediately above the board.
2. Previous and Next column buttons remain visible.
3. Clicking a status pill smoothly centers that column.
4. Horizontal scrolling updates the active status pill.
5. The board retains native horizontal scrolling and drag-and-drop.

### Deal card

1. Lead ID, contract level, customer name, compact actions.
2. Value and owner.
3. **Next:** scheduled client call with relative due time and overdue styling; if absent,
   explicitly say that a follow-up must be scheduled.
4. One latest-activity summary and an age badge.
5. Project updates, when applicable, show only the newest summary plus Create Update / History.

### All Projects card

1. Lead/project identity and contract-level context.
2. **Current work:** active contract stage.
3. Contract value and owner.
4. One latest-activity summary.
5. Project updates collapse to newest summary plus Create Update / History.

### Work Stage card

Keep the existing strong triage layout: task/delivery next action, progress, stage aging, and
open tasks. When no next task/delivery exists, show a neutral explicit empty action. Project
updates collapse to one summary plus History.

## Screen states

- **Loading:** existing per-column progress indicator remains.
- **Empty:** contextual column copy names the empty status; no dead-end generic “No items”.
- **Populated:** one decision-oriented card summary; history is modal-only.
- **Partial permission:** existing permission/capability gates remain authoritative; no new action.
- **Error:** existing retry state remains.
- **Long content:** names and activity titles clamp; compact controls do not shrink.
- **Many columns:** status navigator and previous/next controls provide an explicit alternative to
  dragging the horizontal scrollbar.
- **Mobile:** navigator pills scroll independently; history modal fits within the viewport.

## Guidance copy

- `Previous column` / `Next column`
- `Next: Call client`
- `Call overdue`
- `Next: Schedule follow-up`
- `Current work`
- `Latest activity`
- `No activity yet`
- `History`
- `No items in <status>`

## Acceptance criteria

1. Previous/next and status-pill navigation work for Deals, All Projects, and Work Stages.
2. Deal cards show exactly one next-action line and no expanded call-history boxes.
3. All Projects cards promote the active contract stage and no longer read as a call-history feed.
4. Finalized/project update history renders one latest summary only; full history opens in the
   existing modal.
5. Work Stage cards retain their current triage signals and gain the compact history treatment.
6. Existing preview, update creation, drag-and-drop, bulk selection, permissions, and filters remain.
7. Focused component/helper tests, production compilation/build, and desktop/mobile visual QA pass.
