// admin-residual/admin-projects controller — thin. The list normalizes the frozen
// aggregator's `{ data, total }` into the standard envelope list shape
// `{ items, total, page, pageSize }` (documented FE repoint). create-group uses a
// language-neutral code REPLACING the legacy prose ("Projects created successfully").
import { ok, created } from "../../../shared/http/response.js";
import { adminResidualMessagesCodes, messagesNames } from "@dms/shared";
import { adminProjectsUsecase } from "./admin-projects.usecase.js";
import { leadUsecase } from "../../leads/lead/lead.usecase.js";

const TK = messagesNames.adminResidualMessages;

import { paginate } from "../../../shared/utility/pagination.js";

class AdminProjectsController {
  // create-group acts on a SPECIFIC clientLead (body.clientLeadId) → lead-scoped write.
  // Reuse the leads-module keystone mutate checker (admins have full scope, so behavior is
  // preserved 1:1; a non-full-scope admin sub-role is bounded). Throws 403 on denial.
  checkIfUserCanMutateLeadFromBody(req) {
    return leadUsecase.checkIfUserCanMutateLead({ id: req.body.clientLeadId, authUser: req.auth });
  }

  async getAdminProjects(req, res) {
    const { page, limit, skip } = paginate(req.query);
    const result = await adminProjectsUsecase.listAdminProjects({ query: req.query, limit, skip });
    return ok(
      res,
      { items: result.data ?? [], total: result.total ?? 0, page, pageSize: limit },
      adminResidualMessagesCodes.ADMIN_PROJECTS_FETCHED,
      TK,
    );
  }

  async createProjectGroup(req, res) {
    const data = await adminProjectsUsecase.createProjectGroup({
      clientLeadId: req.body.clientLeadId,
      title: req.body.title,
    });
    return created(res, data, adminResidualMessagesCodes.PROJECT_GROUP_CREATED, TK);
  }
}

export const adminProjectsController = new AdminProjectsController();
export { AdminProjectsController };
