// leads/client/public-lead controller — thin. The PUBLIC website lead funnel. The :leadId
// path param is authoritative (used by complete-register); no body id is trusted. Responds
// via the shared envelope with language-neutral CODES, REPLACING the legacy Arabic/English
// prose ("Lead added successfully", "تم استلام استفسارك بنجاح", "Some thing wrong happen ...").
// Legacy returned the lead under `data` with a `message` string — preserved as `data` + a code.
//
// Methods are plain (no `this`): the router passes them as BARE refs
// (`asyncHandler(c.createLead)`), so they call the directly-imported usecase singleton.
import { ok, created } from "../../../../shared/http/response.js";
import { leadsMessagesCodes, messagesNames } from "@dms/shared";
import { auditCtxFromReq } from "../../../../infra/audit/record-action.js";
import { publicLeadUsecase } from "./public-lead.usecase.js";

const TK = messagesNames.leadsMessages;

class PublicLeadController {
  async createLead(req, res) {
    const lead = await publicLeadUsecase.createLead(req.body, auditCtxFromReq(req));
    return created(res, lead, leadsMessagesCodes.CLIENT_LEAD_CREATED, TK);
  }

  async registerLead(req, res) {
    const lead = await publicLeadUsecase.registerLead(req.body);
    return created(res, lead, leadsMessagesCodes.CLIENT_LEAD_REGISTERED, TK);
  }

  async completeRegister(req, res) {
    const lead = await publicLeadUsecase.completeRegister(req.params.leadId, req.body);
    return ok(res, lead, leadsMessagesCodes.CLIENT_LEAD_REGISTER_COMPLETED, TK);
  }

  async cooperationRequest(req, res) {
    await publicLeadUsecase.cooperationRequest(req.body);
    return ok(res, null, leadsMessagesCodes.COOPERATION_REQUEST_SENT, TK);
  }
}

export const publicLeadController = new PublicLeadController();
export { PublicLeadController };
