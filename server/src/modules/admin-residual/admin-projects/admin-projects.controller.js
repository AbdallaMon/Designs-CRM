// admin-residual/admin-projects controller — thin. The list normalizes the frozen
// aggregator's `{ data, total }` into the standard envelope list shape
// `{ items, total, page, pageSize }` (documented FE repoint). create-group uses a
// language-neutral code REPLACING the legacy prose ("Projects created successfully").
import { ok, created } from "../../../shared/http/response.js";
import { adminResidualMessagesCodes, messagesNames } from "@dms/shared";
import { adminProjectsUsecase } from "./admin-projects.usecase.js";
import { leadUsecase } from "../../leads/lead/lead.usecase.js";

const M = adminResidualMessagesCodes;
const TK = messagesNames.adminResidualMessages;

function paginate(query) {
  const page = parseInt(query.page, 10) || 1;
  const limit = parseInt(query.limit, 10) || 10;
  return { page, limit, skip: (page - 1) * limit };
}

export class AdminProjectsController {
  constructor(usecase) {
    this.usecase = usecase;
  }

  // create-group acts on a SPECIFIC clientLead (body.clientLeadId) → lead-scoped write.
  // Reuse the leads-module keystone mutate checker (admins have full scope, so behavior is
  // preserved 1:1; a non-full-scope admin sub-role is bounded). Throws 403 on denial.
  checkIfUserCanMutateLeadFromBody = (req) =>
    leadUsecase.checkIfUserCanMutateLead({ id: req.body.clientLeadId, authUser: req.auth });

  list = async (req, res) => {
    const { page, limit, skip } = paginate(req.query);
    const result = await this.usecase.list({ query: req.query, limit, skip });
    return ok(
      res,
      { items: result.data ?? [], total: result.total ?? 0, page, pageSize: limit },
      M.ADMIN_PROJECTS_FETCHED,
      TK,
    );
  };

  createGroup = async (req, res) => {
    const data = await this.usecase.createGroup({
      clientLeadId: req.body.clientLeadId,
      title: req.body.title,
    });
    return created(res, data, M.PROJECT_GROUP_CREATED, TK);
  };
}

export const adminProjectsController = new AdminProjectsController(adminProjectsUsecase);
