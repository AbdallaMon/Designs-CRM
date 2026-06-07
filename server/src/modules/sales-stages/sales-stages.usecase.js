// sales-stages usecase — orchestration ONLY (Prisma lives in the repo). SalesStage rows
// are LEAD-SCOPED; the v2 module ADDS the object-scope check the legacy route was MISSING
// by resolving the parent clientLead and running the leads-module checker
// (checkIfUserCanAccessLead) before any read/write — the IDOR fix. The acting user is
// derived from authUser (req.auth), never the body (legacy fetched getCurrentUser but
// then ignored it; the stage logic itself does not persist a user — preserved).
//
// The stage change is a WORKFLOW action (advance to nextStage, or roll back the current
// stage), exposed as POST /:clientLeadId/actions/set-stage — not a generic field PATCH.
// Behavior ported verbatim from the legacy editSalesSage:
//   - if nextStage.key is present and !== "NOT_INITIATED": create the stage row if it
//     does not already exist (the [clientLeadId, stage] unique guard).
//   - if action === "back" and currentStageType !== "NOT_INITIATED": delete that stage
//     row.
import { leadUsecase } from "../leads/lead/lead.usecase.js";
import { salesStagesRepository } from "./sales-stages.repository.js";

export class SalesStagesUsecase {
  constructor(repository, leads = leadUsecase) {
    this.repo = repository;
    this.leads = leads;
  }

  // READ scope. Throws AppError(LEAD_ACCESS_DENIED, 403) when the lead is outside the
  // caller's scope or does not exist (we do not leak existence to an unauthorized
  // caller). Read scope INCLUDES the claimable unassigned-NEW pool — used by reads only.
  async assertLeadAccess({ clientLeadId, authUser }) {
    return this.leads.checkIfUserCanAccessLead({ id: clientLeadId, authUser });
  }

  // WRITE scope (owned-only, stricter). Throws AppError(LEAD_MUTATE_DENIED, 403) when
  // the lead is outside the caller's mutate scope or does not exist. A claimable
  // unassigned-NEW lead is NOT writable until claimed — used by the set-stage action.
  async assertLeadMutate({ clientLeadId, authUser }) {
    return this.leads.checkIfUserCanMutateLead({ id: clientLeadId, authUser });
  }

  // ── GET /:clientLeadId ───────────────────────────────────────────────────────────
  async getStages({ clientLeadId, authUser }) {
    await this.assertLeadAccess({ clientLeadId, authUser });
    return this.repo.getSalesStages({ clientLeadId });
  }

  // ── POST /:clientLeadId/actions/set-stage ────────────────────────────────────────
  // (legacy: POST /:clientLeadId). nextStage is `{ key }`; action is "back"|undefined.
  async setStage({ clientLeadId, nextStage, currentStageType, action, authUser }) {
    // WORKFLOW WRITE action → MUTATE scope (owned-only); a claimable NEW lead is not
    // writable until claimed.
    await this.assertLeadMutate({ clientLeadId, authUser });

    if (nextStage && nextStage.key && nextStage.key !== "NOT_INITIATED") {
      const isPresent = await this.repo.findStage({ clientLeadId, stage: nextStage.key });
      if (!isPresent) {
        await this.repo.createStage({ clientLeadId, stage: nextStage.key });
      }
    }
    if (action === "back" && currentStageType && currentStageType !== "NOT_INITIATED") {
      await this.repo.deleteStage({ clientLeadId, stage: currentStageType });
    }
    return true;
  }
}

export const salesStagesUsecase = new SalesStagesUsecase(salesStagesRepository);
