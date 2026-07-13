// sales-stages controller — thin. Reads validated input, derives the acting user from
// req.auth (never the body), calls the usecase, responds via helpers. The object-scope
// check lives in the usecase (it resolves+checks the parent lead before any read/write).
import { ok } from "../../shared/http/response.js";
import { salesStagesMessagesCodes, messagesNames } from "@dms/shared";
import { salesStagesUsecase } from "./sales-stages.usecase.js";

const TK = messagesNames.salesStagesMessages;

export class SalesStagesController {
  async getStages(req, res) {
    const data = await salesStagesUsecase.getStages({
      clientLeadId: req.params.clientLeadId,
      authUser: req.auth,
    });
    return ok(res, data, salesStagesMessagesCodes.SALES_STAGES_FETCHED, TK);
  }

  async setStage(req, res) {
    const data = await salesStagesUsecase.setStage({
      clientLeadId: req.params.clientLeadId,
      nextStage: req.body.nextStage,
      // accept the legacy misspelling `curentStageType` as a fallback (1:1 compat).
      currentStageType: req.body.currentStageType ?? req.body.curentStageType,
      action: req.body.action,
      authUser: req.auth,
    });
    return ok(res, data, salesStagesMessagesCodes.SALES_STAGE_UPDATED, TK);
  }
}

export const salesStagesController = new SalesStagesController();
