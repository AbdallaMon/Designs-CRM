// audit controller — thin. Reads the validated query, delegates to the usecase, responds
// via the shared envelope helper. No business rules. The viewer is admin-only (the
// `audit.log.view` gate lives on the route).
import { ok } from "../../shared/http/response.js";
import { auditMessagesCodes, messagesNames } from "@dms/shared";
import { auditUsecase } from "./audit.usecase.js";

const C = auditMessagesCodes;
const TK = messagesNames.auditMessages;

export class AuditController {
  constructor(usecase) {
    this.usecase = usecase;
  }

  // GET /v2/audit-logs — paginated, filterable action-audit trail.
  list = async (req, res) => {
    const data = await this.usecase.list({ query: req.query, authUser: req.auth });
    return ok(res, data, C.AUDIT_LOGS_FETCHED, TK);
  };
}

export const auditController = new AuditController(auditUsecase);
