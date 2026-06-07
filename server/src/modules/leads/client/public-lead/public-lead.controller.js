// leads/client/public-lead controller — thin. The PUBLIC website lead funnel. The :leadId
// path param is authoritative (used by complete-register); no body id is trusted. Responds
// via the shared envelope with language-neutral CODES, REPLACING the legacy Arabic/English
// prose ("Lead added successfully", "تم استلام استفسارك بنجاح", "Some thing wrong happen ...").
// Legacy returned the lead under `data` with a `message` string — preserved as `data` + a code.
import { ok, created } from "../../../../shared/http/response.js";
import { leadsMessagesCodes, messagesNames } from "@dms/shared";
import { publicLeadUsecase } from "./public-lead.usecase.js";

const C = leadsMessagesCodes;
const TK = messagesNames.leadsMessages;

export class PublicLeadController {
  constructor(usecase) {
    this.usecase = usecase;
  }

  createLead = async (req, res) => {
    const lead = await this.usecase.createLead(req.body);
    return created(res, lead, C.CLIENT_LEAD_CREATED, TK);
  };

  registerLead = async (req, res) => {
    const lead = await this.usecase.registerLead(req.body);
    return created(res, lead, C.CLIENT_LEAD_REGISTERED, TK);
  };

  completeRegister = async (req, res) => {
    const lead = await this.usecase.completeRegister(req.params.leadId, req.body);
    return ok(res, lead, C.CLIENT_LEAD_REGISTER_COMPLETED, TK);
  };

  cooperationRequest = async (req, res) => {
    await this.usecase.cooperationRequest(req.body);
    return ok(res, null, C.COOPERATION_REQUEST_SENT, TK);
  };
}

export const publicLeadController = new PublicLeadController(publicLeadUsecase);
