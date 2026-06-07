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

const M = imageSessionsMessagesCodes;
const TK = messagesNames.imageSessionsMessages;

export class ClientImageSessionController {
  constructor(usecase) {
    this.usecase = usecase;
  }

  // ── reference-data reads ──────────────────────────────────────────────────────────────
  getPageInfo = async (req, res) => {
    const data = await this.usecase.getPageInfo({ lng: req.query.lng, type: req.query.type });
    return ok(res, data, M.IMAGE_SESSION_PAGE_INFO_FETCHED, TK);
  };
  getProsAndCons = async (req, res) => {
    const isClient = req.query.isClient && req.query.isClient !== "undefined" && req.query.isClient === "true";
    const data = await this.usecase.getProsAndCons({
      id: req.query.id,
      type: req.query.type,
      lng: req.query.lng,
      isClient,
    });
    return ok(res, data, M.IMAGE_SESSION_PROS_CONS_FETCHED, TK);
  };
  getSession = async (req, res) => {
    const data = await this.usecase.getSession({ token: req.query.token });
    return ok(res, data, M.IMAGE_SESSION_SESSION_FETCHED, TK);
  };
  getColors = async (req, res) => {
    const data = await this.usecase.getColors({ lng: req.query.lng });
    return ok(res, data, M.IMAGE_SESSION_COLORS_FETCHED, TK);
  };
  getMaterials = async (req, res) => {
    const data = await this.usecase.getMaterials({ lng: req.query.lng });
    return ok(res, data, M.IMAGE_SESSION_MATERIALS_FETCHED, TK);
  };
  getStyles = async (req, res) => {
    const data = await this.usecase.getStyles({ lng: req.query.lng });
    return ok(res, data, M.IMAGE_SESSION_STYLES_FETCHED, TK);
  };
  getImages = async (req, res) => {
    const data = await this.usecase.getImages({ spaceIds: req.query.spaceIds, styleId: req.query.styleId });
    return ok(res, data, M.IMAGE_SESSION_IMAGES_FETCHED, TK);
  };

  // ── token-keyed status change ────────────────────────────────────────────────────────
  changeStatus = async (req, res) => {
    const data = await this.usecase.changeStatus({ token: req.body.token, sessionStatus: req.body.sessionStatus });
    return ok(res, data, M.IMAGE_SESSION_STATUS_UPDATED, TK);
  };

  // ── token-authoritative saves ──────────────────────────────────────────────────────────
  saveColor = async (req, res) => {
    const data = await this.usecase.saveColor({
      session: req.body.session,
      selectedColor: req.body.selectedColor,
      customColors: req.body.customColors,
      status: req.body.status,
    });
    return ok(res, data, M.IMAGE_SESSION_COLOR_SAVED, TK);
  };
  saveMaterials = async (req, res) => {
    const data = await this.usecase.saveMaterials({
      session: req.body.session,
      selectedMaterials: req.body.selectedMaterials,
      status: req.body.status,
    });
    return ok(res, data, M.IMAGE_SESSION_MATERIAL_SAVED, TK);
  };
  saveStyle = async (req, res) => {
    const data = await this.usecase.saveStyle({
      session: req.body.session,
      selectedStyle: req.body.selectedStyle,
      status: req.body.status,
    });
    return ok(res, data, M.IMAGE_SESSION_STYLE_SAVED, TK);
  };
  saveImages = async (req, res) => {
    const data = await this.usecase.saveImages({
      session: req.body.session,
      selectedImages: req.body.selectedImages,
      status: req.body.status,
    });
    return ok(res, data, M.IMAGE_SESSION_IMAGES_SAVED, TK);
  };
  deleteImage = async (req, res) => {
    const data = await this.usecase.deleteImage({ token: req.body.token, imageId: req.params.imageId });
    return ok(res, data, M.IMAGE_SESSION_IMAGE_DELETED, TK);
  };

  // ── 🔒 generate-pdf (inline SYNC frozen-PDF path; the token's session is authoritative) ──
  generatePdf = async (req, res) => {
    const data = await this.usecase.generatePdf({
      sessionData: req.body.sessionData,
      signatureUrl: req.body.signatureUrl,
      sessionStatus: req.body.sessionStatus,
      lng: req.body.lng,
    });
    return ok(res, data, M.IMAGE_SESSION_PDF_GENERATED, TK);
  };

  // ── EXTRAS router (same base) ──────────────────────────────────────────────────────────
  modelData = async (req, res) => {
    const data = await this.usecase.modelData({ model: req.query.model });
    return ok(res, data, M.IMAGE_SESSION_MODEL_FETCHED, TK);
  };
  savePatterns = async (req, res) => {
    const data = await this.usecase.savePatterns({ token: req.body.token, patternIds: req.body.patterns });
    return ok(res, data, M.IMAGE_SESSION_PATTERNS_SAVED, TK);
  };
  saveSelectionByToken = async (req, res) => {
    const data = await this.usecase.saveSelectionByToken({ token: req.body.token, imageIds: req.body.imageIds });
    return ok(res, data, M.IMAGE_SESSION_SELECTION_SAVED, TK);
  };
}

export const clientImageSessionController = new ClientImageSessionController(clientImageSessionUsecase);
