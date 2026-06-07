// image-sessions/admin routes — the ADMIN reference-data CRUD surface (legacy
// `routes/image-session/admin-image-session.js`, mounted `/admin/image-session` behind the
// "ADMIN" gate). Mounted here under `/v2/image-sessions/admin` (mirrors the legacy
// `/admin/image-session` path). Authentication is mounted ONCE; every route declares its
// IMAGE_SESSION.ADMIN_* code, granted to ADMIN/SUPER_ADMIN base + isSuperSales (via
// SUPER_SALES_EXTRA_PERMISSIONS) so the effective set matches the legacy `isAdmin` union
// EXACTLY (ADMIN/SUPER_ADMIN + isSuperSales + ADMIN/SUPER_ADMIN sub-roles) — without
// widening any other base role. A plain STAFF/sales/designer role is 403'd here.
//
// NO per-lead object scope: this is GLOBAL studio reference data; the admin code is the
// gate (admins see all), preserved 1:1 from legacy.
//
// ROUTE ORDERING: literal sub-paths (`/templates/ids`, `/images/bulk`, `/pros-and-cons/order`)
// are declared BEFORE their `/:id` param siblings so they are not shadowed.
//
// Endpoint map (legacy `/admin/image-session/*` → v2 `/v2/image-sessions/admin/*`, paths 1:1):
//   GET  /space                       POST /space                 PUT  /space/:spaceId
//   GET  /templates                   GET  /templates/ids         POST /templates           PUT /templates/:templateId
//   GET  /material                    POST /material              PUT  /material/:materialId
//   GET  /style                       POST /style                 PUT  /style/:styleId
//   GET  /colors                      POST /colors                PUT  /colors/:colorId
//   GET  /images                      POST /images                POST /images/bulk         PUT /images/:imageId
//   GET  /page-info                   POST /page-info             PUT  /page-info/:pageInfoId
//   POST /pros-and-cons               POST /pros-and-cons/order   PUT  /pros-and-cons/:id    DELETE /pros-and-cons/:id
import { Router } from "express";
import { AuthMiddleware } from "../../../shared/middlewares/auth.middleware.js";
import { asyncHandler } from "../../../shared/middlewares/async-handler.js";
import { validate } from "../../../shared/middlewares/validate.middleware.js";
import { PERMISSIONS } from "@dms/shared";
import { adminImageSessionController } from "./admin-image-session.controller.js";
import { AdminImageSessionValidation as V } from "./admin-image-session.validation.js";

const P = PERMISSIONS.IMAGE_SESSION;
const router = Router();

router.use(AuthMiddleware.requireAuth);

// ── spaces ──────────────────────────────────────────────────────────────────────────
router.get(
  "/space",
  AuthMiddleware.requirePermissions([P.ADMIN_VIEW]),
  validate(V.notArchivedQuery, "query"),
  asyncHandler(adminImageSessionController.listSpaces),
);
router.post(
  "/space",
  AuthMiddleware.requirePermissions([P.ADMIN_MANAGE]),
  validate(V.referenceBody),
  asyncHandler(adminImageSessionController.createSpace),
);
router.put(
  "/space/:spaceId",
  AuthMiddleware.requirePermissions([P.ADMIN_MANAGE]),
  validate(V.spaceIdParam, "params"),
  validate(V.referenceBody),
  asyncHandler(adminImageSessionController.updateSpace),
);

// ── templates (literal /ids before /:templateId) ──────────────────────────────────────
router.get(
  "/templates/ids",
  AuthMiddleware.requirePermissions([P.ADMIN_VIEW]),
  validate(V.typeQuery, "query"),
  asyncHandler(adminImageSessionController.listTemplateIds),
);
router.get(
  "/templates",
  AuthMiddleware.requirePermissions([P.ADMIN_VIEW]),
  validate(V.typeQuery, "query"),
  asyncHandler(adminImageSessionController.listTemplates),
);
router.post(
  "/templates",
  AuthMiddleware.requirePermissions([P.ADMIN_MANAGE]),
  validate(V.referenceBody),
  asyncHandler(adminImageSessionController.createTemplate),
);
router.put(
  "/templates/:templateId",
  AuthMiddleware.requirePermissions([P.ADMIN_MANAGE]),
  validate(V.templateIdParam, "params"),
  validate(V.referenceBody),
  asyncHandler(adminImageSessionController.updateTemplate),
);

// ── materials ──────────────────────────────────────────────────────────────────────────
router.get(
  "/material",
  AuthMiddleware.requirePermissions([P.ADMIN_VIEW]),
  validate(V.notArchivedQuery, "query"),
  asyncHandler(adminImageSessionController.listMaterials),
);
router.post(
  "/material",
  AuthMiddleware.requirePermissions([P.ADMIN_MANAGE]),
  validate(V.referenceBody),
  asyncHandler(adminImageSessionController.createMaterial),
);
router.put(
  "/material/:materialId",
  AuthMiddleware.requirePermissions([P.ADMIN_MANAGE]),
  validate(V.materialIdParam, "params"),
  validate(V.referenceBody),
  asyncHandler(adminImageSessionController.updateMaterial),
);

// ── styles ─────────────────────────────────────────────────────────────────────────────
router.get(
  "/style",
  AuthMiddleware.requirePermissions([P.ADMIN_VIEW]),
  validate(V.notArchivedQuery, "query"),
  asyncHandler(adminImageSessionController.listStyles),
);
router.post(
  "/style",
  AuthMiddleware.requirePermissions([P.ADMIN_MANAGE]),
  validate(V.referenceBody),
  asyncHandler(adminImageSessionController.createStyle),
);
router.put(
  "/style/:styleId",
  AuthMiddleware.requirePermissions([P.ADMIN_MANAGE]),
  validate(V.styleIdParam, "params"),
  validate(V.referenceBody),
  asyncHandler(adminImageSessionController.updateStyle),
);

// ── colors ─────────────────────────────────────────────────────────────────────────────
router.get(
  "/colors",
  AuthMiddleware.requirePermissions([P.ADMIN_VIEW]),
  validate(V.notArchivedQuery, "query"),
  asyncHandler(adminImageSessionController.listColors),
);
router.post(
  "/colors",
  AuthMiddleware.requirePermissions([P.ADMIN_MANAGE]),
  validate(V.referenceBody),
  asyncHandler(adminImageSessionController.createColor),
);
router.put(
  "/colors/:colorId",
  AuthMiddleware.requirePermissions([P.ADMIN_MANAGE]),
  validate(V.colorIdParam, "params"),
  validate(V.referenceBody),
  asyncHandler(adminImageSessionController.updateColor),
);

// ── design images (literal /bulk before /:imageId) ────────────────────────────────────
router.get(
  "/images",
  AuthMiddleware.requirePermissions([P.ADMIN_VIEW]),
  validate(V.imagesQuery, "query"),
  asyncHandler(adminImageSessionController.listImages),
);
router.post(
  "/images/bulk",
  AuthMiddleware.requirePermissions([P.ADMIN_MANAGE]),
  validate(V.referenceBody),
  asyncHandler(adminImageSessionController.createBulkImage),
);
router.post(
  "/images",
  AuthMiddleware.requirePermissions([P.ADMIN_MANAGE]),
  validate(V.referenceBody),
  asyncHandler(adminImageSessionController.createImage),
);
router.put(
  "/images/:imageId",
  AuthMiddleware.requirePermissions([P.ADMIN_MANAGE]),
  validate(V.imageIdParam, "params"),
  validate(V.referenceBody),
  asyncHandler(adminImageSessionController.updateImage),
);

// ── page-info ─────────────────────────────────────────────────────────────────────────
router.get(
  "/page-info",
  AuthMiddleware.requirePermissions([P.ADMIN_VIEW]),
  validate(V.notArchivedQuery, "query"),
  asyncHandler(adminImageSessionController.listPageInfo),
);
router.post(
  "/page-info",
  AuthMiddleware.requirePermissions([P.ADMIN_MANAGE]),
  validate(V.referenceBody),
  asyncHandler(adminImageSessionController.createPageInfo),
);
router.put(
  "/page-info/:pageInfoId",
  AuthMiddleware.requirePermissions([P.ADMIN_MANAGE]),
  validate(V.pageInfoIdParam, "params"),
  validate(V.referenceBody),
  asyncHandler(adminImageSessionController.updatePageInfo),
);

// ── pros & cons (literal /order before /:id) ────────────────────────────────────────────
router.post(
  "/pros-and-cons/order",
  AuthMiddleware.requirePermissions([P.ADMIN_MANAGE]),
  validate(V.reorderProsCons),
  asyncHandler(adminImageSessionController.reorderProsAndCons),
);
router.post(
  "/pros-and-cons",
  AuthMiddleware.requirePermissions([P.ADMIN_MANAGE]),
  validate(V.createProCon),
  asyncHandler(adminImageSessionController.createProOrCon),
);
router.put(
  "/pros-and-cons/:id",
  AuthMiddleware.requirePermissions([P.ADMIN_MANAGE]),
  validate(V.proConIdParam, "params"),
  validate(V.updateProCon),
  asyncHandler(adminImageSessionController.updateProOrCon),
);
router.delete(
  "/pros-and-cons/:id",
  AuthMiddleware.requirePermissions([P.ADMIN_MANAGE]),
  validate(V.proConIdParam, "params"),
  validate(V.deleteProCon),
  asyncHandler(adminImageSessionController.deleteProOrCon),
);

export { router as adminImageSessionRouter };
