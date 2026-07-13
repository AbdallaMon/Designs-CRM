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

const TK = messagesNames.imageSessionsMessages;

class ImageSessionController {
  async listForLead(req, res) {
    const data = await imageSessionUsecase.listForLead({ clientLeadId: req.params.clientLeadId, authUser: req.auth });
    return ok(res, data, imageSessionsMessagesCodes.IMAGE_SESSIONS_FETCHED, TK);
  }

  async createForLead(req, res) {
    const data = await imageSessionUsecase.createForLead({
      clientLeadId: req.params.clientLeadId,
      spaces: req.body.spaces,
      authUser: req.auth,
    });
    return created(res, data, imageSessionsMessagesCodes.IMAGE_SESSION_CREATED, TK);
  }

  async editFields(req, res) {
    const data = await imageSessionUsecase.editFields({
      clientLeadId: req.params.clientLeadId,
      sessionId: req.params.sessionId,
      data: req.body,
      authUser: req.auth,
    });
    return ok(res, data, imageSessionsMessagesCodes.IMAGE_SESSION_UPDATED, TK);
  }

  async regenerateToken(req, res) {
    const data = await imageSessionUsecase.regenerateToken({ sessionId: req.params.sessionId, authUser: req.auth });
    return ok(res, data, imageSessionsMessagesCodes.IMAGE_SESSION_TOKEN_REGENERATED, TK);
  }

  async deleteSession(req, res) {
    const data = await imageSessionUsecase.deleteSession({ sessionId: req.params.sessionId, authUser: req.auth });
    return ok(res, data, imageSessionsMessagesCodes.IMAGE_SESSION_DELETED, TK);
  }

  async modelIds(req, res) {
    const { model, ...searchParams } = req.query;
    const data = await imageSessionUsecase.modelIds({ model, searchParams });
    return ok(res, data, imageSessionsMessagesCodes.IMAGE_SESSION_MODEL_IDS_FETCHED, TK);
  }
}

export const imageSessionController = new ImageSessionController();
export { ImageSessionController };
