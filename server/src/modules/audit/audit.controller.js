// audit controller — thin. Reads the validated query, delegates to the usecase, responds
// via the shared envelope helper. No business rules. The viewer is admin-only (the
// `audit.log.view` gate lives on the route).
import { ok } from "../../shared/http/response.js";
import { auditMessagesCodes, messagesNames } from "@dms/shared";
import { auditUsecase } from "./audit.usecase.js";

const TK = messagesNames.auditMessages;

class AuditController {
  // GET /v2/audit-logs — paginated, filterable action-audit trail.
  async getAuditLogs(req, res) {
    const data = await auditUsecase.listAuditLogs({ query: req.query, authUser: req.auth });
    return ok(res, data, auditMessagesCodes.AUDIT_LOGS_FETCHED, TK);
  }
}

export const auditController = new AuditController();
export { AuditController };
