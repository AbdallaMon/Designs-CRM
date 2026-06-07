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

const M = adminResidualMessagesCodes;
const TK = messagesNames.adminResidualMessages;

export class AdminLeadsController {
  constructor(usecase) {
    this.usecase = usecase;
  }

  // ── lead-scope checkers (reuse the leads-module keystone) ────────────────────────
  // The lead id arrives as :id (update / delete) or :leadId (telegram).
  checkIfUserCanMutateLead = (req) =>
    leadUsecase.checkIfUserCanMutateLead({
      id: req.params.id ?? req.params.leadId,
      authUser: req.auth,
    });

  // ── bulk excel import (the frozen service owns the (req,res) response) ───────────
  importLeads = (req, res) => this.usecase.importLeadsFromExcel({ req, res });

  // ── admin lead field update (lead-scoped) ────────────────────────────────────────
  updateLead = async (req, res) => {
    const data = await this.usecase.updateLeadField({ id: req.params.id, body: req.body });
    return ok(res, data, M.LEAD_UPDATED, TK);
  };

  // ── admin client field update (client-keyed; documented: no single lead to scope) ─
  updateClient = async (req, res) => {
    const data = await this.usecase.updateClientField({ clientId: req.params.clientId, body: req.body });
    return ok(res, data, M.CLIENT_UPDATED, TK);
  };

  // ── admin delete lead (base-role-ADMIN only + lead-scoped) ───────────────────────
  deleteLead = async (req, res) => {
    const data = await this.usecase.deleteLead({ id: req.params.id, authUser: req.auth });
    return ok(res, data, M.LEAD_DELETED, TK);
  };

  // ── telegram (lead-scoped) ────────────────────────────────────────────────────────
  createTelegramLink = async (req, res) => {
    const data = await this.usecase.createTelegramLink({ leadId: req.params.leadId });
    return created(res, data, M.TELEGRAM_CHANNEL_CREATED, TK);
  };

  assignTelegramUsers = async (req, res) => {
    const data = await this.usecase.assignTelegramUsers({ clientLeadId: req.params.leadId });
    return ok(res, data, M.TELEGRAM_USERS_QUEUED, TK);
  };

  // ── admin create new lead ─────────────────────────────────────────────────────────
  createNewLead = async (req, res) => {
    const data = await this.usecase.createNewLead({ body: req.body });
    return created(res, data, M.LEAD_CREATED, TK);
  };
}

export const adminLeadsController = new AdminLeadsController(adminLeadsUsecase);
