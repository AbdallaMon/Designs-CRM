// image-sessions/client controller — thin. The PUBLIC client image-selection surface. The
// token comes from the query (GET /session, GET /data) or the body's session object
// (saves / generate-pdf) / the body token (status, extras). No session is involved.
// Responds via the shared envelope helpers with language-neutral codes — REPLACING the
// legacy PROSE ("New session created succussfully" / "Response saved succussfully" /
// "Some thing wrong happened" / "Error in generating pdf"). The token is the session
// selector; the usecase derives/overrides the session identity from the token (IDOR close).
import { ok } from "../../../shared/http/response.js";
import { imageSessionsMessagesCodes, messagesNames } from "@dms/shared";
import { clientImageSessionUsecase } from "./client-image-session.usecase.js";

const TK = messagesNames.imageSessionsMessages;

class ClientImageSessionController {
  // ── reference-data reads ──────────────────────────────────────────────────────────────
  async getPageInfo(req, res) {
    const data = await clientImageSessionUsecase.getPageInfo({ lng: req.query.lng, type: req.query.type });
    return ok(res, data, imageSessionsMessagesCodes.IMAGE_SESSION_PAGE_INFO_FETCHED, TK);
  }
  async getProsAndCons(req, res) {
    const isClient = req.query.isClient && req.query.isClient !== "undefined" && req.query.isClient === "true";
    const data = await clientImageSessionUsecase.getProsAndCons({
      id: req.query.id,
      type: req.query.type,
      lng: req.query.lng,
      isClient,
    });
    return ok(res, data, imageSessionsMessagesCodes.IMAGE_SESSION_PROS_CONS_FETCHED, TK);
  }
  async getSession(req, res) {
    const data = await clientImageSessionUsecase.getSession({ token: req.query.token });
    return ok(res, data, imageSessionsMessagesCodes.IMAGE_SESSION_SESSION_FETCHED, TK);
  }
  async getColors(req, res) {
    const data = await clientImageSessionUsecase.getColors({ lng: req.query.lng });
    return ok(res, data, imageSessionsMessagesCodes.IMAGE_SESSION_COLORS_FETCHED, TK);
  }
  async getMaterials(req, res) {
    const data = await clientImageSessionUsecase.getMaterials({ lng: req.query.lng });
    return ok(res, data, imageSessionsMessagesCodes.IMAGE_SESSION_MATERIALS_FETCHED, TK);
  }
  async getStyles(req, res) {
    const data = await clientImageSessionUsecase.getStyles({ lng: req.query.lng });
    return ok(res, data, imageSessionsMessagesCodes.IMAGE_SESSION_STYLES_FETCHED, TK);
  }
  async getImages(req, res) {
    const data = await clientImageSessionUsecase.getImages({ spaceIds: req.query.spaceIds, styleId: req.query.styleId });
    return ok(res, data, imageSessionsMessagesCodes.IMAGE_SESSION_IMAGES_FETCHED, TK);
  }

  // ── token-keyed status change ────────────────────────────────────────────────────────
  async changeStatus(req, res) {
    const data = await clientImageSessionUsecase.changeStatus({ token: req.body.token, sessionStatus: req.body.sessionStatus });
    return ok(res, data, imageSessionsMessagesCodes.IMAGE_SESSION_STATUS_UPDATED, TK);
  }

  // ── token-authoritative saves ──────────────────────────────────────────────────────────
  async saveColor(req, res) {
    const data = await clientImageSessionUsecase.saveColor({
      session: req.body.session,
      selectedColor: req.body.selectedColor,
      customColors: req.body.customColors,
      status: req.body.status,
    });
    return ok(res, data, imageSessionsMessagesCodes.IMAGE_SESSION_COLOR_SAVED, TK);
  }
  async saveMaterials(req, res) {
    const data = await clientImageSessionUsecase.saveMaterials({
      session: req.body.session,
      selectedMaterials: req.body.selectedMaterials,
      status: req.body.status,
    });
    return ok(res, data, imageSessionsMessagesCodes.IMAGE_SESSION_MATERIAL_SAVED, TK);
  }
  async saveStyle(req, res) {
    const data = await clientImageSessionUsecase.saveStyle({
      session: req.body.session,
      selectedStyle: req.body.selectedStyle,
      status: req.body.status,
    });
    return ok(res, data, imageSessionsMessagesCodes.IMAGE_SESSION_STYLE_SAVED, TK);
  }
  async saveImages(req, res) {
    const data = await clientImageSessionUsecase.saveImages({
      session: req.body.session,
      selectedImages: req.body.selectedImages,
      status: req.body.status,
    });
    return ok(res, data, imageSessionsMessagesCodes.IMAGE_SESSION_IMAGES_SAVED, TK);
  }
  async deleteImage(req, res) {
    const data = await clientImageSessionUsecase.deleteImage({ token: req.body.token, imageId: req.params.imageId });
    return ok(res, data, imageSessionsMessagesCodes.IMAGE_SESSION_IMAGE_DELETED, TK);
  }

  // ── 🔒 generate-pdf (inline SYNC frozen-PDF path; the token's session is authoritative) ──
  async generatePdf(req, res) {
    const data = await clientImageSessionUsecase.generatePdf({
      sessionData: req.body.sessionData,
      signatureUrl: req.body.signatureUrl,
      sessionStatus: req.body.sessionStatus,
      lng: req.body.lng,
    });
    return ok(res, data, imageSessionsMessagesCodes.IMAGE_SESSION_PDF_GENERATED, TK);
  }

  // ── EXTRAS router (same base) ──────────────────────────────────────────────────────────
  async getModelData(req, res) {
    const data = await clientImageSessionUsecase.getModelData({ model: req.query.model });
    return ok(res, data, imageSessionsMessagesCodes.IMAGE_SESSION_MODEL_FETCHED, TK);
  }
  async savePatterns(req, res) {
    const data = await clientImageSessionUsecase.savePatterns({ token: req.body.token, patternIds: req.body.patterns });
    return ok(res, data, imageSessionsMessagesCodes.IMAGE_SESSION_PATTERNS_SAVED, TK);
  }
  async saveSelectionByToken(req, res) {
    const data = await clientImageSessionUsecase.saveSelectionByToken({ token: req.body.token, imageIds: req.body.imageIds });
    return ok(res, data, imageSessionsMessagesCodes.IMAGE_SESSION_SELECTION_SAVED, TK);
  }
}

export const clientImageSessionController = new ClientImageSessionController();
export { ClientImageSessionController };
