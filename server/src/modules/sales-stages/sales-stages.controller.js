// sales-stages controller — thin. Reads validated input, derives the acting user from
// req.auth (never the body), calls the usecase, responds via helpers. The object-scope
// check lives in the usecase (it resolves+checks the parent lead before any read/write).
import { ok } from "../../shared/http/response.js";
import { salesStagesMessagesCodes, messagesNames } from "@dms/shared";
import { salesStagesUsecase } from "./sales-stages.usecase.js";

const C = salesStagesMessagesCodes;
const TK = messagesNames.salesStagesMessages;

export class SalesStagesController {
  constructor(usecase) {
    this.usecase = usecase;
  }

  getStages = async (req, res) => {
    const data = await this.usecase.getStages({
      clientLeadId: req.params.clientLeadId,
      authUser: req.auth,
    });
    return ok(res, data, C.SALES_STAGES_FETCHED, TK);
  };

  setStage = async (req, res) => {
    const data = await this.usecase.setStage({
      clientLeadId: req.params.clientLeadId,
      nextStage: req.body.nextStage,
      // accept the legacy misspelling `curentStageType` as a fallback (1:1 compat).
      currentStageType: req.body.currentStageType ?? req.body.curentStageType,
      action: req.body.action,
      authUser: req.auth,
    });
    return ok(res, data, C.SALES_STAGE_UPDATED, TK);
  };
}

export const salesStagesController = new SalesStagesController(salesStagesUsecase);
