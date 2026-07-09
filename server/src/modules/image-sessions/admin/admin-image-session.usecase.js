// image-sessions/admin usecase — the ADMIN reference-data CRUD surface (legacy
// `routes/image-session/admin-image-session.js`, mounted `/admin/image-session` behind the
// "ADMIN" gate = the `isAdmin` union: ADMIN/SUPER_ADMIN base + isSuperSales + ADMIN/
// SUPER_ADMIN sub-roles). This is GLOBAL studio reference data (spaces, templates,
// materials, styles, colors, design images, page-info, pros-and-cons) — there is NO
// per-lead object to scope; the ADMIN permission code IS the gate (admins see all),
// preserved 1:1 from legacy. The acting user is not consumed by any of these service fns.
//
// All the heavy reference-data CRUD logic stays in the FROZEN-ish legacy
// `imageSessionSevices.js` service and is invoked via lazy adapters — NEVER duplicated.
// Errors are thrown as AppError(code, statusCode); the envelope serializes them. The single
// special-cased error is the page-info unique-type P2002 (legacy returned a friendly prose
// message) → re-thrown as a language-neutral code.
import { AppError } from "../../../shared/errors/AppError.js";
import { imageSessionsMessagesCodes as M } from "@dms/shared";

const SPACE = "./space.repo.js";
const TEMPLATE = "./template.repo.js";
const MATERIAL = "./material.repo.js";
const STYLE = "./style.repo.js";
const COLOR = "./color.repo.js";
const DESIGN_IMAGE = "./design-image.repo.js";
const PAGE_INFO = "./page-info.repo.js";
const PROS_CONS = "./pros-cons.repo.js";
const load = (path, fn) => (a) => import(path).then((m) => m[fn](a));

// Lazy adapters to the per-entity admin reference-data repos (behavior-preserving).
const legacyDefaults = {
  getSpaces: load(SPACE, "getSpaces"),
  createSpace: load(SPACE, "createSpace"),
  updateSpace: load(SPACE, "updateSpace"),
  getTemplates: load(TEMPLATE, "getTemplates"),
  getTemplatesIds: load(TEMPLATE, "getTemplatesIds"),
  createTemplate: load(TEMPLATE, "createTemplate"),
  updateTemplate: load(TEMPLATE, "updateTemplate"),
  getMaterials: load(MATERIAL, "getMaterials"),
  createMaterial: load(MATERIAL, "createMaterial"),
  editMaterial: load(MATERIAL, "editMaterial"),
  getStyles: load(STYLE, "getStyles"),
  createStyle: load(STYLE, "createStyle"),
  editStyle: load(STYLE, "editStyle"),
  getColors: load(COLOR, "getColors"),
  createColorPallete: load(COLOR, "createColorPallete"),
  editColorPallete: load(COLOR, "editColorPallete"),
  getDesignImages: load(DESIGN_IMAGE, "getDesignImages"),
  createDesignImage: load(DESIGN_IMAGE, "createDesignImage"),
  createBulkDesignImage: load(DESIGN_IMAGE, "createBulkDesignImage"),
  editDesignImage: load(DESIGN_IMAGE, "editDesignImage"),
  getPageInfos: load(PAGE_INFO, "getPageInfos"),
  createPageInfo: load(PAGE_INFO, "createPageInfo"),
  editPageInfo: load(PAGE_INFO, "editPageInfo"),
  createProOrCon: load(PROS_CONS, "createProOrCon"),
  reorderProsAndCons: load(PROS_CONS, "reorderProsAndCons"),
  editProOrCon: load(PROS_CONS, "editProOrCon"),
  deleteProOrCon: load(PROS_CONS, "deleteProOrCon"),
};

export class AdminImageSessionUsecase {
  constructor(legacy = {}) {
    this.legacy = { ...legacyDefaults, ...legacy };
  }

  // ── spaces ──────────────────────────────────────────────────────────────────────
  listSpaces({ notArchived }) {
    return this.legacy.getSpaces({ notArchived });
  }
  createSpace({ data }) {
    return this.legacy.createSpace({ data });
  }
  updateSpace({ spaceId, data }) {
    return this.legacy.updateSpace({ spaceId, data });
  }

  // ── templates ─────────────────────────────────────────────────────────────────────
  listTemplates({ type }) {
    return this.legacy.getTemplates({ type });
  }
  listTemplateIds({ type }) {
    return this.legacy.getTemplatesIds({ type });
  }
  createTemplate({ template }) {
    return this.legacy.createTemplate({ template });
  }
  updateTemplate({ templateId, template }) {
    return this.legacy.updateTemplate({ templateId, template });
  }

  // ── materials ──────────────────────────────────────────────────────────────────────
  listMaterials({ notArchived }) {
    return this.legacy.getMaterials({ notArchived });
  }
  createMaterial({ data }) {
    return this.legacy.createMaterial({ data });
  }
  updateMaterial({ materialId, data }) {
    return this.legacy.editMaterial({ materialId, data });
  }

  // ── styles ──────────────────────────────────────────────────────────────────────────
  listStyles({ notArchived }) {
    return this.legacy.getStyles({ notArchived });
  }
  createStyle({ data }) {
    return this.legacy.createStyle({ data });
  }
  updateStyle({ styleId, data }) {
    return this.legacy.editStyle({ styleId, data });
  }

  // ── colors ────────────────────────────────────────────────────────────────────────
  listColors({ notArchived }) {
    return this.legacy.getColors({ notArchived });
  }
  createColor({ data }) {
    return this.legacy.createColorPallete({ data });
  }
  updateColor({ colorId, data }) {
    return this.legacy.editColorPallete({ colorId, data });
  }

  // ── design images (the list returns its own paginated shape — preserved 1:1) ─────────
  listImages({ notArchived, skip, limit }) {
    return this.legacy.getDesignImages({ notArchived, skip, limit });
  }
  createImage({ data }) {
    return this.legacy.createDesignImage({ data });
  }
  createBulkImage({ data }) {
    return this.legacy.createBulkDesignImage({ data });
  }
  updateImage({ imageId, data }) {
    return this.legacy.editDesignImage({ imageId, data });
  }

  // ── page-info ─────────────────────────────────────────────────────────────────────
  listPageInfo({ notArchived }) {
    return this.legacy.getPageInfos({ notArchived });
  }
  // Legacy mapped the Prisma P2002 unique_type violation to a friendly prose message; we
  // map it to a language-neutral code (no prose) while preserving the 4xx semantics.
  async createPageInfo({ data }) {
    try {
      return await this.legacy.createPageInfo({ data });
    } catch (e) {
      if (e?.code === "P2002" && e?.meta?.target?.includes?.("unique_type")) {
        throw new AppError(M.IMAGE_SESSION_PAGE_INFO_TYPE_EXISTS, 409);
      }
      throw e;
    }
  }
  updatePageInfo({ pageInfoId, data }) {
    return this.legacy.editPageInfo({ pageInfoId, data });
  }

  // ── pros & cons ──────────────────────────────────────────────────────────────────────
  createProOrCon({ type, id, item, itemType }) {
    return this.legacy.createProOrCon({ type, id, item, itemType });
  }
  reorderProsAndCons({ itemType, data }) {
    return this.legacy.reorderProsAndCons({ itemType, data });
  }
  updateProOrCon({ id, item, itemType }) {
    return this.legacy.editProOrCon({ id, item, itemType });
  }
  deleteProOrCon({ id, itemType }) {
    return this.legacy.deleteProOrCon({ id, itemType });
  }
}

export const adminImageSessionUsecase = new AdminImageSessionUsecase();
