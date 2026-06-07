// image-sessions/session controller — thin. The SHARED, lead-scoped surface. Reads
// validated input, derives the acting user from req.auth (never the body), calls the
// usecase, responds via the shared envelope helpers with language-neutral codes (REPLACING
// the legacy prose like "New session created succussfully"). The object-scope check lives
// in the usecase (it resolves the parent clientLead — directly for :clientLeadId, or via
// session→clientLeadId for :sessionId — and runs the leads-module checker before any
// read/write). Path ids are authoritative over body ids.
import { ok, created } from "../../../shared/http/response.js";
import { imageSessionsMessagesCodes, messagesNames } from "@dms/shared";
import { imageSessionUsecase } from "./image-session.usecase.js";

const M = imageSessionsMessagesCodes;
const TK = messagesNames.imageSessionsMessages;

export class ImageSessionController {
  constructor(usecase) {
    this.usecase = usecase;
  }

  listForLead = async (req, res) => {
    const data = await this.usecase.listForLead({ clientLeadId: req.params.clientLeadId, authUser: req.auth });
    return ok(res, data, M.IMAGE_SESSIONS_FETCHED, TK);
  };

  createForLead = async (req, res) => {
    const data = await this.usecase.createForLead({
      clientLeadId: req.params.clientLeadId,
      spaces: req.body.spaces,
      authUser: req.auth,
    });
    return created(res, data, M.IMAGE_SESSION_CREATED, TK);
  };

  editFields = async (req, res) => {
    const data = await this.usecase.editFields({
      clientLeadId: req.params.clientLeadId,
      sessionId: req.params.sessionId,
      data: req.body,
      authUser: req.auth,
    });
    return ok(res, data, M.IMAGE_SESSION_UPDATED, TK);
  };

  regenerateToken = async (req, res) => {
    const data = await this.usecase.regenerateToken({ sessionId: req.params.sessionId, authUser: req.auth });
    return ok(res, data, M.IMAGE_SESSION_TOKEN_REGENERATED, TK);
  };

  deleteSession = async (req, res) => {
    const data = await this.usecase.deleteSession({ sessionId: req.params.sessionId, authUser: req.auth });
    return ok(res, data, M.IMAGE_SESSION_DELETED, TK);
  };

  modelIds = async (req, res) => {
    const { model, ...searchParams } = req.query;
    const data = await this.usecase.modelIds({ model, searchParams });
    return ok(res, data, M.IMAGE_SESSION_MODEL_IDS_FETCHED, TK);
  };
}

export const imageSessionController = new ImageSessionController(imageSessionUsecase);
