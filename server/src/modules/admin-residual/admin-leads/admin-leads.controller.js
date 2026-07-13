// admin-residual/admin-leads controller — thin. Reads validated input, calls the usecase,
// responds via the envelope helpers with language-neutral codes (REPLACING the legacy prose
// "Lead updated/Deleted/added successfully", the Telegram prose, and the Arabic/English
// new-lead messages). The lead-scoped writes carry a special checker that reuses the
// leads-module keystone mutate checker (the IDOR-class guard the legacy admin routes lacked
// — admins have full scope, so behavior is preserved 1:1, but a non-full-scope admin
// sub-role is bounded).
import { ok, created } from "../../../shared/http/response.js";
import { adminResidualMessagesCodes, messagesNames } from "@dms/shared";
import { adminLeadsUsecase } from "./admin-leads.usecase.js";
import { leadUsecase } from "../../leads/lead/lead.usecase.js";

const TK = messagesNames.adminResidualMessages;

class AdminLeadsController {
  // ── lead-scope checkers (reuse the leads-module keystone) ────────────────────────
  // The lead id arrives as :id (update / delete) or :leadId (telegram).
  checkIfUserCanMutateLead(req) {
    return leadUsecase.checkIfUserCanMutateLead({
      id: req.params.id ?? req.params.leadId,
      authUser: req.auth,
    });
  }

  // ── bulk excel import (controller owns req/res; ported VERBATIM from the legacy
  //    createLeadFromExcelData handler's responses) ─────────────────────────────────
  async importLeads(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
      await adminLeadsUsecase.importLeadsFromExcel({ file: req.file });
      return res.status(200).json({ message: "Data processed successfully" });
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ error: "An error occurred while processing the data" });
    }
  }

  // ── admin lead field update (lead-scoped) ────────────────────────────────────────
  async updateLead(req, res) {
    const data = await adminLeadsUsecase.updateLeadField({ id: req.params.id, body: req.body });
    return ok(res, data, adminResidualMessagesCodes.LEAD_UPDATED, TK);
  }

  // ── admin client field update (client-keyed; documented: no single lead to scope) ─
  async updateClient(req, res) {
    const data = await adminLeadsUsecase.updateClientField({ clientId: req.params.clientId, body: req.body });
    return ok(res, data, adminResidualMessagesCodes.CLIENT_UPDATED, TK);
  }

  // ── admin delete lead (base-role-ADMIN only + lead-scoped) ───────────────────────
  async deleteLead(req, res) {
    const data = await adminLeadsUsecase.deleteLead({ id: req.params.id, authUser: req.auth });
    return ok(res, data, adminResidualMessagesCodes.LEAD_DELETED, TK);
  }

  // ── telegram (lead-scoped) ────────────────────────────────────────────────────────
  async createTelegramLink(req, res) {
    const data = await adminLeadsUsecase.createTelegramLink({ leadId: req.params.leadId });
    return created(res, data, adminResidualMessagesCodes.TELEGRAM_CHANNEL_CREATED, TK);
  }

  async assignTelegramUsers(req, res) {
    const data = await adminLeadsUsecase.assignTelegramUsers({ clientLeadId: req.params.leadId });
    return ok(res, data, adminResidualMessagesCodes.TELEGRAM_USERS_QUEUED, TK);
  }

  // ── admin create new lead ─────────────────────────────────────────────────────────
  async createNewLead(req, res) {
    const data = await adminLeadsUsecase.createNewLead({ body: req.body });
    return created(res, data, adminResidualMessagesCodes.LEAD_CREATED, TK);
  }
}

export const adminLeadsController = new AdminLeadsController();
export { AdminLeadsController };
