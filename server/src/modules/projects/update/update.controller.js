// Thin controller for the updates surface. The checkIfUserCan* methods resolve the
// parent clientLead (in the usecase) and run the SHARED project-lead scope checker.
import { ok, created } from "../../../shared/http/response.js";
import { projectsMessagesCodes, messagesNames } from "@dms/shared";
import { updateUsecase } from "./update.usecase.js";
import { withUpdateListCapabilities } from "./update.dto.js";

const TK = messagesNames.projectsMessages;

class UpdateController {
  // ── object-scope checkers ──────────────────────────────────────────────────────
  // GET/POST /:clientLeadId → scope on the lead directly.
  checkIfUserCanAccessLead(req) {
    return updateUsecase.checkIfUserCanAccessLead({ clientLeadId: req.params.clientLeadId, authUser: req.auth });
  }

  // /:updateId/* and /shared-settings/:updateId → resolve the update's parent lead.
  checkIfUserCanAccessUpdate(req) {
    return updateUsecase.checkIfUserCanAccessUpdateById({ updateId: req.params.updateId, authUser: req.auth });
  }

  // /shared-updates/:sharedUpdateId/* → resolve the shared-update's parent lead.
  checkIfUserCanAccessSharedUpdate(req) {
    return updateUsecase.checkIfUserCanAccessSharedUpdate({ sharedUpdateId: req.params.sharedUpdateId, authUser: req.auth });
  }

  // ── reads ──────────────────────────────────────────────────────────────────────
  async getUpdates(req, res) {
    const items = await updateUsecase.listUpdates({ clientLeadId: req.params.clientLeadId, query: req.query, authUser: req.auth });
    return ok(res, { items: withUpdateListCapabilities(items, req.auth) }, projectsMessagesCodes.UPDATES_FETCHED, TK);
  }

  async getSharedSettings(req, res) {
    const data = await updateUsecase.getSharedSettings({ updateId: req.params.updateId });
    return ok(res, data, projectsMessagesCodes.UPDATE_SHARED_SETTINGS_FETCHED, TK);
  }

  // ── create ───────────────────────────────────────────────────────────────────
  async createUpdate(req, res) {
    const data = await updateUsecase.createUpdate({
      clientLeadId: req.params.clientLeadId,
      body: req.body,
      query: req.query,
      authUser: req.auth,
    });
    return created(res, data, projectsMessagesCodes.UPDATE_CREATED, TK);
  }

  // ── workflow actions ───────────────────────────────────────────────────────────
  async authorize(req, res) {
    const data = await updateUsecase.authorize({ updateId: req.params.updateId, body: req.body });
    return ok(res, data, projectsMessagesCodes.UPDATE_DEPARTMENT_AUTHORIZED, TK);
  }

  async authorizeShared(req, res) {
    const data = await updateUsecase.authorizeShared({ updateId: req.params.updateId, body: req.body });
    return ok(res, data, projectsMessagesCodes.UPDATE_DEPARTMENT_UNAUTHORIZED, TK);
  }

  async archive(req, res) {
    const data = await updateUsecase.archive({ updateId: req.params.updateId, body: req.body });
    return ok(res, data, projectsMessagesCodes.UPDATE_ARCHIVE_TOGGLED, TK);
  }

  async archiveShared(req, res) {
    const data = await updateUsecase.archiveShared({ sharedUpdateId: req.params.sharedUpdateId, body: req.body });
    return ok(res, data, projectsMessagesCodes.SHARED_UPDATE_ARCHIVE_TOGGLED, TK);
  }

  async markDone(req, res) {
    const data = await updateUsecase.markDone({ updateId: req.params.updateId, body: req.body });
    return ok(res, data, projectsMessagesCodes.UPDATE_MARKED_DONE, TK);
  }
}

export const updateController = new UpdateController();
export { UpdateController };
