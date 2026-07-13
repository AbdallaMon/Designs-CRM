// image-sessions/admin usecase — the ADMIN reference-data CRUD surface (legacy
// `routes/image-session/admin-image-session.js`, mounted `/admin/image-session` behind the
// "ADMIN" gate = the `isAdmin` union: ADMIN/SUPER_ADMIN base + isSuperSales + ADMIN/
// SUPER_ADMIN sub-roles). This is GLOBAL studio reference data (spaces, templates,
// materials, styles, colors, design images, page-info, pros-and-cons) — there is NO
// per-lead object to scope; the ADMIN permission code IS the gate (admins see all),
// preserved 1:1 from legacy. The acting user is not consumed by any of these service fns.
//
// All the heavy reference-data CRUD logic stays in the per-entity admin reference-data
// repos and is invoked directly — NEVER duplicated. Errors are thrown as
// AppError(code, statusCode); the envelope serializes them. The single special-cased error
// is the page-info unique-type P2002 (legacy returned a friendly prose message) → re-thrown
// as a language-neutral code.
import { AppError } from "../../../shared/errors/AppError.js";
import { imageSessionsMessagesCodes } from "@dms/shared";
import { getSpaces, createSpace as createSpaceFn, updateSpace as updateSpaceFn } from "./space.repo.js";
import {
  getTemplates,
  getTemplatesIds,
  createTemplate as createTemplateFn,
  updateTemplate as updateTemplateFn,
} from "./template.repo.js";
import { getMaterials, createMaterial as createMaterialFn, editMaterial } from "./material.repo.js";
import { getStyles, createStyle as createStyleFn, editStyle } from "./style.repo.js";
import { getColors, createColorPallete, editColorPallete } from "./color.repo.js";
import {
  getDesignImages,
  createDesignImage,
  createBulkDesignImage,
  editDesignImage,
} from "./design-image.repo.js";
import { getPageInfos, createPageInfo as createPageInfoFn, editPageInfo } from "./page-info.repo.js";
import {
  createProOrCon as createProOrConFn,
  reorderProsAndCons as reorderProsAndConsFn,
  editProOrCon,
  deleteProOrCon as deleteProOrConFn,
} from "./pros-cons.repo.js";

class AdminImageSessionUsecase {
  // ── spaces ──────────────────────────────────────────────────────────────────────
  listSpaces({ notArchived }) {
    return getSpaces({ notArchived });
  }
  createSpace({ data }) {
    return createSpaceFn({ data });
  }
  updateSpace({ spaceId, data }) {
    return updateSpaceFn({ spaceId, data });
  }

  // ── templates ─────────────────────────────────────────────────────────────────────
  listTemplates({ type }) {
    return getTemplates({ type });
  }
  listTemplateIds({ type }) {
    return getTemplatesIds({ type });
  }
  createTemplate({ template }) {
    return createTemplateFn({ template });
  }
  updateTemplate({ templateId, template }) {
    return updateTemplateFn({ templateId, template });
  }

  // ── materials ──────────────────────────────────────────────────────────────────────
  listMaterials({ notArchived }) {
    return getMaterials({ notArchived });
  }
  createMaterial({ data }) {
    return createMaterialFn({ data });
  }
  updateMaterial({ materialId, data }) {
    return editMaterial({ materialId, data });
  }

  // ── styles ──────────────────────────────────────────────────────────────────────────
  listStyles({ notArchived }) {
    return getStyles({ notArchived });
  }
  createStyle({ data }) {
    return createStyleFn({ data });
  }
  updateStyle({ styleId, data }) {
    return editStyle({ styleId, data });
  }

  // ── colors ────────────────────────────────────────────────────────────────────────
  listColors({ notArchived }) {
    return getColors({ notArchived });
  }
  createColor({ data }) {
    return createColorPallete({ data });
  }
  updateColor({ colorId, data }) {
    return editColorPallete({ colorId, data });
  }

  // ── design images (the list returns its own paginated shape — preserved 1:1) ─────────
  listImages({ notArchived, skip, limit }) {
    return getDesignImages({ notArchived, skip, limit });
  }
  createImage({ data }) {
    return createDesignImage({ data });
  }
  createBulkImage({ data }) {
    return createBulkDesignImage({ data });
  }
  updateImage({ imageId, data }) {
    return editDesignImage({ imageId, data });
  }

  // ── page-info ─────────────────────────────────────────────────────────────────────
  listPageInfo({ notArchived }) {
    return getPageInfos({ notArchived });
  }
  // Legacy mapped the Prisma P2002 unique_type violation to a friendly prose message; we
  // map it to a language-neutral code (no prose) while preserving the 4xx semantics.
  async createPageInfo({ data }) {
    try {
      return await createPageInfoFn({ data });
    } catch (e) {
      if (e?.code === "P2002" && e?.meta?.target?.includes?.("unique_type")) {
        throw new AppError(imageSessionsMessagesCodes.IMAGE_SESSION_PAGE_INFO_TYPE_EXISTS, 409);
      }
      throw e;
    }
  }
  updatePageInfo({ pageInfoId, data }) {
    return editPageInfo({ pageInfoId, data });
  }

  // ── pros & cons ──────────────────────────────────────────────────────────────────────
  createProOrCon({ type, id, item, itemType }) {
    return createProOrConFn({ type, id, item, itemType });
  }
  reorderProsAndCons({ itemType, data }) {
    return reorderProsAndConsFn({ itemType, data });
  }
  updateProOrCon({ id, item, itemType }) {
    return editProOrCon({ id, item, itemType });
  }
  deleteProOrCon({ id, itemType }) {
    return deleteProOrConFn({ id, itemType });
  }
}

export const adminImageSessionUsecase = new AdminImageSessionUsecase();
export { AdminImageSessionUsecase };
