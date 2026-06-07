// image-sessions/admin controller — thin. Reads validated input, calls the usecase, and
// responds via the shared envelope helpers with language-neutral codes (REPLACING the
// legacy prose like "Space created successfully" / "Template updated"). Path ids are
// authoritative over the body. There is NO per-lead object scope here — this is GLOBAL
// studio reference data and the ADMIN permission code is the gate (admins see all),
// preserved 1:1 from the legacy `/admin/image-session` "ADMIN" gate.
import { ok, created } from "../../../shared/http/response.js";
import { imageSessionsMessagesCodes, messagesNames } from "@dms/shared";
import { adminImageSessionUsecase } from "./admin-image-session.usecase.js";

const M = imageSessionsMessagesCodes;
const TK = messagesNames.imageSessionsMessages;

export class AdminImageSessionController {
  constructor(usecase) {
    this.usecase = usecase;
  }

  // ── spaces ────────────────────────────────────────────────────────────────────────
  listSpaces = async (req, res) => {
    const data = await this.usecase.listSpaces({ notArchived: req.query.notArchived });
    return ok(res, data, M.IMAGE_SESSION_REFERENCE_FETCHED, TK);
  };
  createSpace = async (req, res) => {
    const data = await this.usecase.createSpace({ data: req.body });
    return created(res, data, M.IMAGE_SESSION_SPACE_CREATED, TK);
  };
  updateSpace = async (req, res) => {
    const data = await this.usecase.updateSpace({ spaceId: req.params.spaceId, data: req.body });
    return ok(res, data, M.IMAGE_SESSION_SPACE_UPDATED, TK);
  };

  // ── templates ────────────────────────────────────────────────────────────────────────
  listTemplates = async (req, res) => {
    const data = await this.usecase.listTemplates({ type: req.query.type });
    return ok(res, data, M.IMAGE_SESSION_REFERENCE_FETCHED, TK);
  };
  listTemplateIds = async (req, res) => {
    const data = await this.usecase.listTemplateIds({ type: req.query.type });
    return ok(res, data, M.IMAGE_SESSION_REFERENCE_FETCHED, TK);
  };
  createTemplate = async (req, res) => {
    const data = await this.usecase.createTemplate({ template: req.body });
    return created(res, data, M.IMAGE_SESSION_TEMPLATE_CREATED, TK);
  };
  updateTemplate = async (req, res) => {
    const data = await this.usecase.updateTemplate({ templateId: req.params.templateId, template: req.body });
    return ok(res, data, M.IMAGE_SESSION_TEMPLATE_UPDATED, TK);
  };

  // ── materials ──────────────────────────────────────────────────────────────────────
  listMaterials = async (req, res) => {
    const data = await this.usecase.listMaterials({ notArchived: req.query.notArchived });
    return ok(res, data, M.IMAGE_SESSION_REFERENCE_FETCHED, TK);
  };
  createMaterial = async (req, res) => {
    const data = await this.usecase.createMaterial({ data: req.body });
    return created(res, data, M.IMAGE_SESSION_MATERIAL_CREATED, TK);
  };
  updateMaterial = async (req, res) => {
    const data = await this.usecase.updateMaterial({ materialId: req.params.materialId, data: req.body });
    return ok(res, data, M.IMAGE_SESSION_MATERIAL_UPDATED, TK);
  };

  // ── styles ─────────────────────────────────────────────────────────────────────────
  listStyles = async (req, res) => {
    const data = await this.usecase.listStyles({ notArchived: req.query.notArchived });
    return ok(res, data, M.IMAGE_SESSION_REFERENCE_FETCHED, TK);
  };
  createStyle = async (req, res) => {
    const data = await this.usecase.createStyle({ data: req.body });
    return created(res, data, M.IMAGE_SESSION_STYLE_CREATED, TK);
  };
  updateStyle = async (req, res) => {
    const data = await this.usecase.updateStyle({ styleId: req.params.styleId, data: req.body });
    return ok(res, data, M.IMAGE_SESSION_STYLE_UPDATED, TK);
  };

  // ── colors ─────────────────────────────────────────────────────────────────────────
  listColors = async (req, res) => {
    const data = await this.usecase.listColors({ notArchived: req.query.notArchived });
    return ok(res, data, M.IMAGE_SESSION_REFERENCE_FETCHED, TK);
  };
  createColor = async (req, res) => {
    const data = await this.usecase.createColor({ data: req.body });
    return created(res, data, M.IMAGE_SESSION_COLOR_CREATED, TK);
  };
  updateColor = async (req, res) => {
    const data = await this.usecase.updateColor({ colorId: req.params.colorId, data: req.body });
    return ok(res, data, M.IMAGE_SESSION_COLOR_UPDATED, TK);
  };

  // ── design images ───────────────────────────────────────────────────────────────────
  // Legacy `/images` returned its paginated payload at the TOP level (res.json(data));
  // v2 nests it under the envelope `data` (the standard list shape) — documented FE repoint.
  listImages = async (req, res) => {
    const data = await this.usecase.listImages({
      notArchived: req.query.notArchived,
      skip: req.query.skip,
      limit: req.query.limit,
    });
    return ok(res, data, M.IMAGE_SESSION_REFERENCE_FETCHED, TK);
  };
  createImage = async (req, res) => {
    const data = await this.usecase.createImage({ data: req.body });
    return created(res, data, M.IMAGE_SESSION_IMAGE_CREATED, TK);
  };
  createBulkImage = async (req, res) => {
    const data = await this.usecase.createBulkImage({ data: req.body });
    return created(res, data, M.IMAGE_SESSION_IMAGE_CREATED, TK);
  };
  updateImage = async (req, res) => {
    const data = await this.usecase.updateImage({ imageId: req.params.imageId, data: req.body });
    return ok(res, data, M.IMAGE_SESSION_IMAGE_UPDATED, TK);
  };

  // ── page-info ─────────────────────────────────────────────────────────────────────
  listPageInfo = async (req, res) => {
    const data = await this.usecase.listPageInfo({ notArchived: req.query.notArchived });
    return ok(res, data, M.IMAGE_SESSION_REFERENCE_FETCHED, TK);
  };
  createPageInfo = async (req, res) => {
    const data = await this.usecase.createPageInfo({ data: req.body });
    return created(res, data, M.IMAGE_SESSION_PAGE_INFO_CREATED, TK);
  };
  updatePageInfo = async (req, res) => {
    const data = await this.usecase.updatePageInfo({ pageInfoId: req.params.pageInfoId, data: req.body });
    return ok(res, data, M.IMAGE_SESSION_PAGE_INFO_UPDATED, TK);
  };

  // ── pros & cons ────────────────────────────────────────────────────────────────────
  createProOrCon = async (req, res) => {
    const data = await this.usecase.createProOrCon({
      type: req.body.type,
      id: req.body.id,
      item: req.body.item,
      itemType: req.body.itemType,
    });
    return created(res, data, M.IMAGE_SESSION_PRO_CON_CREATED, TK);
  };
  reorderProsAndCons = async (req, res) => {
    const data = await this.usecase.reorderProsAndCons({ itemType: req.body.itemType, data: req.body.data });
    return ok(res, data, M.IMAGE_SESSION_PRO_CON_REORDERED, TK);
  };
  updateProOrCon = async (req, res) => {
    const data = await this.usecase.updateProOrCon({
      id: req.params.id,
      item: req.body.item,
      itemType: req.body.itemType,
    });
    return ok(res, data, M.IMAGE_SESSION_PRO_CON_UPDATED, TK);
  };
  deleteProOrCon = async (req, res) => {
    const data = await this.usecase.deleteProOrCon({ id: req.params.id, itemType: req.body.itemType });
    return ok(res, data, M.IMAGE_SESSION_PRO_CON_DELETED, TK);
  };
}

export const adminImageSessionController = new AdminImageSessionController(adminImageSessionUsecase);
