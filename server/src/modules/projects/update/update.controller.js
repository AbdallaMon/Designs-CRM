// Thin controller for the updates surface. The checkIfUserCan* methods resolve the
// parent clientLead (in the usecase) and run the SHARED project-lead scope checker.
import { ok, created } from "../../../shared/http/response.js";
import { projectsMessagesCodes, messagesNames } from "@dms/shared";
import { updateUsecase } from "./update.usecase.js";
import { withUpdateListCapabilities } from "./update.dto.js";

const C = projectsMessagesCodes;
const TK = messagesNames.projectsMessages;

export class UpdateController {
  /** @param {import("./update.usecase.js").UpdateUsecase} usecase */
  constructor(usecase) {
    this.usecase = usecase;
  }

  // ── object-scope checkers ──────────────────────────────────────────────────────
  // GET/POST /:clientLeadId → scope on the lead directly.
  checkIfUserCanAccessLead = (req) =>
    this.usecase.checkIfUserCanAccessLead({ clientLeadId: req.params.clientLeadId, authUser: req.auth });

  // /:updateId/* and /shared-settings/:updateId → resolve the update's parent lead.
  checkIfUserCanAccessUpdate = (req) =>
    this.usecase.checkIfUserCanAccessUpdateById({ updateId: req.params.updateId, authUser: req.auth });

  // /shared-updates/:sharedUpdateId/* → resolve the shared-update's parent lead.
  checkIfUserCanAccessSharedUpdate = (req) =>
    this.usecase.checkIfUserCanAccessSharedUpdate({ sharedUpdateId: req.params.sharedUpdateId, authUser: req.auth });

  // ── reads ──────────────────────────────────────────────────────────────────────
  list = async (req, res) => {
    const items = await this.usecase.list({ clientLeadId: req.params.clientLeadId, query: req.query, authUser: req.auth });
    return ok(res, { items: withUpdateListCapabilities(items, req.auth) }, C.UPDATES_FETCHED, TK);
  };

  sharedSettings = async (req, res) => {
    const data = await this.usecase.sharedSettings({ updateId: req.params.updateId });
    return ok(res, data, C.UPDATE_SHARED_SETTINGS_FETCHED, TK);
  };

  // ── create ───────────────────────────────────────────────────────────────────
  create = async (req, res) => {
    const data = await this.usecase.create({
      clientLeadId: req.params.clientLeadId,
      body: req.body,
      query: req.query,
      authUser: req.auth,
    });
    return created(res, data, C.UPDATE_CREATED, TK);
  };

  // ── workflow actions ───────────────────────────────────────────────────────────
  authorize = async (req, res) => {
    const data = await this.usecase.authorize({ updateId: req.params.updateId, body: req.body });
    return ok(res, data, C.UPDATE_DEPARTMENT_AUTHORIZED, TK);
  };

  authorizeShared = async (req, res) => {
    const data = await this.usecase.authorizeShared({ updateId: req.params.updateId, body: req.body });
    return ok(res, data, C.UPDATE_DEPARTMENT_UNAUTHORIZED, TK);
  };

  archive = async (req, res) => {
    const data = await this.usecase.archive({ updateId: req.params.updateId, body: req.body });
    return ok(res, data, C.UPDATE_ARCHIVE_TOGGLED, TK);
  };

  archiveShared = async (req, res) => {
    const data = await this.usecase.archiveShared({ sharedUpdateId: req.params.sharedUpdateId, body: req.body });
    return ok(res, data, C.SHARED_UPDATE_ARCHIVE_TOGGLED, TK);
  };

  markDone = async (req, res) => {
    const data = await this.usecase.markDone({ updateId: req.params.updateId, body: req.body });
    return ok(res, data, C.UPDATE_MARKED_DONE, TK);
  };
}

export const updateController = new UpdateController(updateUsecase);
