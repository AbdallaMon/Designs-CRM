// image-sessions/admin controller — thin. Reads validated input, calls the usecase, and
// responds via the shared envelope helpers with language-neutral codes (REPLACING the
// legacy prose like "Space created successfully" / "Template updated"). Path ids are
// authoritative over the body. There is NO per-lead object scope here — this is GLOBAL
// studio reference data and the ADMIN permission code is the gate (admins see all),
// preserved 1:1 from the legacy `/admin/image-session` "ADMIN" gate.
import { ok, created } from "../../../shared/http/response.js";
import { imageSessionsMessagesCodes, messagesNames } from "@dms/shared";
import { adminImageSessionUsecase } from "./admin-image-session.usecase.js";

const TK = messagesNames.imageSessionsMessages;

class AdminImageSessionController {
  // ── spaces ────────────────────────────────────────────────────────────────────────
  async listSpaces(req, res) {
    const data = await adminImageSessionUsecase.listSpaces({ notArchived: req.query.notArchived });
    return ok(res, data, imageSessionsMessagesCodes.IMAGE_SESSION_REFERENCE_FETCHED, TK);
  }
  async createSpace(req, res) {
    const data = await adminImageSessionUsecase.createSpace({ data: req.body });
    return created(res, data, imageSessionsMessagesCodes.IMAGE_SESSION_SPACE_CREATED, TK);
  }
  async updateSpace(req, res) {
    const data = await adminImageSessionUsecase.updateSpace({ spaceId: req.params.spaceId, data: req.body });
    return ok(res, data, imageSessionsMessagesCodes.IMAGE_SESSION_SPACE_UPDATED, TK);
  }

  // ── templates ────────────────────────────────────────────────────────────────────────
  async listTemplates(req, res) {
    const data = await adminImageSessionUsecase.listTemplates({ type: req.query.type });
    return ok(res, data, imageSessionsMessagesCodes.IMAGE_SESSION_REFERENCE_FETCHED, TK);
  }
  async listTemplateIds(req, res) {
    const data = await adminImageSessionUsecase.listTemplateIds({ type: req.query.type });
    return ok(res, data, imageSessionsMessagesCodes.IMAGE_SESSION_REFERENCE_FETCHED, TK);
  }
  async createTemplate(req, res) {
    const data = await adminImageSessionUsecase.createTemplate({ template: req.body });
    return created(res, data, imageSessionsMessagesCodes.IMAGE_SESSION_TEMPLATE_CREATED, TK);
  }
  async updateTemplate(req, res) {
    const data = await adminImageSessionUsecase.updateTemplate({ templateId: req.params.templateId, template: req.body });
    return ok(res, data, imageSessionsMessagesCodes.IMAGE_SESSION_TEMPLATE_UPDATED, TK);
  }

  // ── materials ──────────────────────────────────────────────────────────────────────
  async listMaterials(req, res) {
    const data = await adminImageSessionUsecase.listMaterials({ notArchived: req.query.notArchived });
    return ok(res, data, imageSessionsMessagesCodes.IMAGE_SESSION_REFERENCE_FETCHED, TK);
  }
  async createMaterial(req, res) {
    const data = await adminImageSessionUsecase.createMaterial({ data: req.body });
    return created(res, data, imageSessionsMessagesCodes.IMAGE_SESSION_MATERIAL_CREATED, TK);
  }
  async updateMaterial(req, res) {
    const data = await adminImageSessionUsecase.updateMaterial({ materialId: req.params.materialId, data: req.body });
    return ok(res, data, imageSessionsMessagesCodes.IMAGE_SESSION_MATERIAL_UPDATED, TK);
  }

  // ── styles ─────────────────────────────────────────────────────────────────────────
  async listStyles(req, res) {
    const data = await adminImageSessionUsecase.listStyles({ notArchived: req.query.notArchived });
    return ok(res, data, imageSessionsMessagesCodes.IMAGE_SESSION_REFERENCE_FETCHED, TK);
  }
  async createStyle(req, res) {
    const data = await adminImageSessionUsecase.createStyle({ data: req.body });
    return created(res, data, imageSessionsMessagesCodes.IMAGE_SESSION_STYLE_CREATED, TK);
  }
  async updateStyle(req, res) {
    const data = await adminImageSessionUsecase.updateStyle({ styleId: req.params.styleId, data: req.body });
    return ok(res, data, imageSessionsMessagesCodes.IMAGE_SESSION_STYLE_UPDATED, TK);
  }

  // ── colors ─────────────────────────────────────────────────────────────────────────
  async listColors(req, res) {
    const data = await adminImageSessionUsecase.listColors({ notArchived: req.query.notArchived });
    return ok(res, data, imageSessionsMessagesCodes.IMAGE_SESSION_REFERENCE_FETCHED, TK);
  }
  async createColor(req, res) {
    const data = await adminImageSessionUsecase.createColor({ data: req.body });
    return created(res, data, imageSessionsMessagesCodes.IMAGE_SESSION_COLOR_CREATED, TK);
  }
  async updateColor(req, res) {
    const data = await adminImageSessionUsecase.updateColor({ colorId: req.params.colorId, data: req.body });
    return ok(res, data, imageSessionsMessagesCodes.IMAGE_SESSION_COLOR_UPDATED, TK);
  }

  // ── design images ───────────────────────────────────────────────────────────────────
  // Legacy `/images` returned its paginated payload at the TOP level (res.json(data));
  // v2 nests it under the envelope `data` (the standard list shape) — documented FE repoint.
  async listImages(req, res) {
    const data = await adminImageSessionUsecase.listImages({
      notArchived: req.query.notArchived,
      skip: req.query.skip,
      limit: req.query.limit,
    });
    return ok(res, data, imageSessionsMessagesCodes.IMAGE_SESSION_REFERENCE_FETCHED, TK);
  }
  async createImage(req, res) {
    const data = await adminImageSessionUsecase.createImage({ data: req.body });
    return created(res, data, imageSessionsMessagesCodes.IMAGE_SESSION_IMAGE_CREATED, TK);
  }
  async createBulkImage(req, res) {
    const data = await adminImageSessionUsecase.createBulkImage({ data: req.body });
    return created(res, data, imageSessionsMessagesCodes.IMAGE_SESSION_IMAGE_CREATED, TK);
  }
  async updateImage(req, res) {
    const data = await adminImageSessionUsecase.updateImage({ imageId: req.params.imageId, data: req.body });
    return ok(res, data, imageSessionsMessagesCodes.IMAGE_SESSION_IMAGE_UPDATED, TK);
  }

  // ── page-info ─────────────────────────────────────────────────────────────────────
  async listPageInfo(req, res) {
    const data = await adminImageSessionUsecase.listPageInfo({ notArchived: req.query.notArchived });
    return ok(res, data, imageSessionsMessagesCodes.IMAGE_SESSION_REFERENCE_FETCHED, TK);
  }
  async createPageInfo(req, res) {
    const data = await adminImageSessionUsecase.createPageInfo({ data: req.body });
    return created(res, data, imageSessionsMessagesCodes.IMAGE_SESSION_PAGE_INFO_CREATED, TK);
  }
  async updatePageInfo(req, res) {
    const data = await adminImageSessionUsecase.updatePageInfo({ pageInfoId: req.params.pageInfoId, data: req.body });
    return ok(res, data, imageSessionsMessagesCodes.IMAGE_SESSION_PAGE_INFO_UPDATED, TK);
  }

  // ── pros & cons ────────────────────────────────────────────────────────────────────
  async createProOrCon(req, res) {
    const data = await adminImageSessionUsecase.createProOrCon({
      type: req.body.type,
      id: req.body.id,
      item: req.body.item,
      itemType: req.body.itemType,
    });
    return created(res, data, imageSessionsMessagesCodes.IMAGE_SESSION_PRO_CON_CREATED, TK);
  }
  async reorderProsAndCons(req, res) {
    const data = await adminImageSessionUsecase.reorderProsAndCons({ itemType: req.body.itemType, data: req.body.data });
    return ok(res, data, imageSessionsMessagesCodes.IMAGE_SESSION_PRO_CON_REORDERED, TK);
  }
  async updateProOrCon(req, res) {
    const data = await adminImageSessionUsecase.updateProOrCon({
      id: req.params.id,
      item: req.body.item,
      itemType: req.body.itemType,
    });
    return ok(res, data, imageSessionsMessagesCodes.IMAGE_SESSION_PRO_CON_UPDATED, TK);
  }
  async deleteProOrCon(req, res) {
    const data = await adminImageSessionUsecase.deleteProOrCon({ id: req.params.id, itemType: req.body.itemType });
    return ok(res, data, imageSessionsMessagesCodes.IMAGE_SESSION_PRO_CON_DELETED, TK);
  }
}

export const adminImageSessionController = new AdminImageSessionController();
export { AdminImageSessionController };
