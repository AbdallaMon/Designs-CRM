# Contract stage-chain hardening design

Date: 2026-08-18  
Branch: `feat/workstage-flow-redesign`

## Goal

Keep the current contract-level/work-stage outcome while making the transition chain deterministic, safe when levels are omitted, and repairable by an administrator through a dedicated audited action.

## Preserved business chain

| Trigger | Completed contract level | Next normal level |
|---|---|---|
| Signature payment processed | `LEVEL_1` | `LEVEL_2` |
| `2D_Study` project completed | `LEVEL_2` | `LEVEL_3` |
| `3D_Designer` project completed | `LEVEL_3` | `LEVEL_4` |
| `2D_Final_Plans` project completed | `LEVEL_4` | `LEVEL_5` |
| `2D_Quantity_Calculation` project completed | `LEVEL_5` | `LEVEL_6` |

The configured stages remain authoritative. If the normal next level is absent, the workflow starts the next configured stage by ascending `order`. For example, completing `LEVEL_2` in a contract containing `LEVEL_2`, `LEVEL_4`, and `LEVEL_6` completes `LEVEL_2` and starts `LEVEL_4`.

## Automatic transition rules

1. Project automation only consumes the active contract stage whose level corresponds to the project type. Completing an unrelated or already-completed project is a no-op.
2. Only `IN_PROGRESS` contracts for the same lead and project group participate. A cancelled or completed contract never advances.
3. If more than one active contract intentionally references the same lead/project group and active level, each contract advances independently in the same transaction. This avoids the old partial result where several next stages started but only one previous stage completed.
4. The current stage becomes `COMPLETED` and receives `endDate`; the next configured stage becomes `IN_PROGRESS` and receives `startDate`.
5. If there is no next configured stage, the current stage still completes. The contract becomes `COMPLETED` only when no unfinished stages or unpaid/due payments remain.
6. Repeating the same completion event is idempotent because there is no longer a matching active current stage.
7. The signature-payment trigger completes active `LEVEL_1` and starts the next configured stage. If the contract omitted `LEVEL_1` and has never started a stage, it starts the first configured stage once.

## Delivery schedules

- A schedule is created or updated whenever a stage becomes active.
- The deadline remains `activation time + deptDeliveryDays` in calendar days. `deliveryDays` remains the client-facing duration and does not drive the internal schedule.
- Schedule creation is idempotent through the existing unique `stageId` relation.
- Editing `deptDeliveryDays` recalculates from the stage's `startDate`, falling back to the schedule's `createdAt` for legacy rows. The removed `ContractStage.createdAt` assumption was invalid because that column does not exist.
- Automatic schedules linked to cancelled contracts are hidden from project schedule lists, while their database history is preserved. A replacement contract therefore creates its own schedules without showing the cancelled contract's stale dates.
- Cancelling a contract does not erase or reset project work. A replacement contract that deliberately reuses the same project group keeps those project statuses; its newly activated stages receive new schedules, and an admin can use the audited override to align the replacement contract with already-finished work when no new project-completion event will occur.

## Admin stage override

Endpoint:

`POST /v2/contracts/:contractId/stages/:stageId/actions/override-status`

Body:

```json
{
  "status": "IN_PROGRESS",
  "reason": "Repair after legacy transition failure"
}
```

Rules:

- A new `contract.stage.override_status` permission is granted only to the `ADMIN` and `SUPER_ADMIN` profiles. It is not added to the shared contract permission block or to `SUPER_SALES`.
- The normal stage update endpoint continues to accept day fields only; there is no generic status edit.
- Lead mutate-scope and stage-to-contract ownership checks still run.
- A reason is mandatory and is stored in the action audit detail.
- Cancelled contracts cannot be stage-overridden; contract cancellation/reopening is a separate lifecycle decision.
- `IN_PROGRESS`: earlier stages become completed, the selected stage becomes the sole active stage, and later stages become not started.
- `COMPLETED`: stages through the selected one become completed, the next configured stage starts, and later stages remain not started. With no next stage, contract completion is recomputed.
- `NOT_STARTED`: the chain rewinds to immediately before the selected stage: the previous configured stage becomes active, earlier stages are completed, and the selected/later stages become not started. For the first stage, all stages remain not started.
- Reopening any part of a completed contract returns the contract to `IN_PROGRESS`; terminal completion still respects outstanding payments.
- Every successful override writes `CONTRACT_STAGE_STATUS_OVERRIDDEN` with actor context, previous/target status, reason, and the resulting active stage.

## Non-goals

- No Prisma schema or migration change.
- No PDF-generation change.
- No working-day calendar is introduced; deadlines remain calendar-day based.
- Existing historical schedules are not deleted.

## Verification

- Repository tests cover every automatic link, skipped levels, idempotency, terminal completion, signature start, schedule upsert, and cancelled-contract exclusion.
- Usecase/permission tests cover admin-only access, object scope, child ownership, cancelled-contract rejection, and audit detail.
- Validation tests cover the status enum, mandatory reason, and strict payload rejection.
- Frontend build and focused helper/component coverage confirm the permission-gated repair control and request payload.
