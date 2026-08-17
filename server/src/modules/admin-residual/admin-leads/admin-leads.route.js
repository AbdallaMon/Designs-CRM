// admin-residual/admin-leads routes — the residual admin lead/client operations (legacy
// `routes/admin/admin.js`, ADMIN gate). Mounted under `/v2/admin`. Auth once at the parent
// aggregate router; every route gated by an ADMIN_RESIDUAL.* code (granted to ADMIN/
// SUPER_ADMIN base + isSuperSales — the legacy `isAdmin` union). LEAD-scoped writes ALSO
// carry the leads-module keystone mutate checker (the IDOR-class guard legacy lacked).
//
// Endpoint map (legacy → v2, paths 1:1; gate column = the v2 permission code):
//   POST   /leads/excel                              → POST   /v2/admin/leads/excel              LEAD_IMPORT
//   POST   /leads/update/:id                         → POST   /v2/admin/leads/update/:id         LEAD_EDIT   (+ lead-scope)
//   PUT    /client/update/:clientId                  → PUT    /v2/admin/client/update/:clientId  CLIENT_EDIT (client-keyed; no lead scope — see note)
//   DELETE /client-leads/:id                         → DELETE /v2/admin/client-leads/:id         LEAD_DELETE (+ lead-scope)
//   POST   /new-lead                                 → POST   /v2/admin/new-lead                 LEAD_CREATE
//   POST   /client-leads/:leadId/telegram/new        → POST   /v2/admin/client-leads/:leadId/telegram/new           TELEGRAM_MANAGE (+ lead-scope)
//   POST   /client-leads/:leadId/telegram/assign-users → POST /v2/admin/client-leads/:leadId/telegram/assign-users  TELEGRAM_MANAGE (+ lead-scope)
//
// SCOPE DECISIONS (per route):
//   - /leads/update/:id, DELETE /client-leads/:id, telegram/new + assign-users → LEAD-scoped:
//     run checkIfUserCanMutateLead on the path lead (admins keep full scope = behavior 1:1).
//   - PUT /client/update/:clientId → keyed by a CLIENT id (a client may own MANY leads); there
//     is no single lead to scope to and legacy applied none. The ADMIN code is the gate
//     (admins have full scope). Documented decision — not an IDOR regression vs legacy.
import { Router } from "express";
import multer from "multer";
import { AuthMiddleware } from "../../../shared/middlewares/auth.middleware.js";
import { asyncHandler } from "../../../shared/middlewares/async-handler.js";
import { validate } from "../../../shared/middlewares/validate.middleware.js";
import { AppError } from "../../../shared/errors/AppError.js";
import { PERMISSIONS, generalMessagesCodes } from "@dms/shared";
import { adminLeadsController } from "./admin-leads.controller.js";
import { AdminLeadsValidation } from "./admin-leads.validation.js";

const P = PERMISSIONS.ADMIN_RESIDUAL;
const router = Router();

// FROZEN upload mechanism — memoryStorage single-file, identical to the legacy admin route.
const upload = multer({ storage: multer.memoryStorage() });

// Validate the excel upload (presence + spreadsheet mime) WITHOUT changing the upload
// mechanism — runs AFTER multer has populated req.file.
function requireExcelFile(req, res, next) {
  const file = req.file;
  if (!file) {
    return next(
      new AppError({
        code: generalMessagesCodes.VALIDATION_ERROR,
        statusCode: 422,
        details: [
          { path: "file", message: generalMessagesCodes.FILE_REQUIRED },
        ],
      }),
    );
  }
  const allowed = [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel", // some clients report .xlsx with the legacy mime
    "text/csv",
    "application/octet-stream", // some browsers send this for .xlsx
  ];
  const hasSupportedExtension = /\.(?:xlsx|csv)$/i.test(file.originalname || "");
  if (
    !hasSupportedExtension ||
    (file.mimetype && !allowed.includes(file.mimetype))
  ) {
    return next(
      new AppError({
        code: generalMessagesCodes.VALIDATION_ERROR,
        statusCode: 422,
        details: [
          {
            path: "file",
            message: generalMessagesCodes.UNSUPPORTED_FILE_TYPE,
          },
        ],
      }),
    );
  }
  return next();
}

// ── bulk excel import (the frozen service owns the response) ─────────────────────────────
router.post(
  "/leads/excel",
  AuthMiddleware.requirePermissions([P.LEAD_IMPORT]),
  upload.single("file"),
  requireExcelFile,
  asyncHandler(adminLeadsController.importLeads),
);

// ── admin lead field update (lead-scoped) ────────────────────────────────────────────────
router.post(
  "/leads/update/:id",
  AuthMiddleware.requirePermissions([P.LEAD_EDIT]),
  validate(AdminLeadsValidation.idParam, "params"),
  AuthMiddleware.requireSpecialChecker(adminLeadsController.checkIfUserCanMutateLead),
  validate(AdminLeadsValidation.fieldUpdate),
  asyncHandler(adminLeadsController.updateLead),
);

// ── admin client field update (client-keyed; no single lead to scope — see header) ────────
router.put(
  "/client/update/:clientId",
  AuthMiddleware.requirePermissions([P.CLIENT_EDIT]),
  validate(AdminLeadsValidation.clientIdParam, "params"),
  validate(AdminLeadsValidation.fieldUpdate),
  asyncHandler(adminLeadsController.updateClient),
);

// ── admin delete lead (lead-scoped) ──────────────────────────────────────────────────────
router.delete(
  "/client-leads/:id",
  AuthMiddleware.requirePermissions([P.LEAD_DELETE]),
  validate(AdminLeadsValidation.idParam, "params"),
  AuthMiddleware.requireSpecialChecker(adminLeadsController.checkIfUserCanMutateLead),
  asyncHandler(adminLeadsController.deleteLead),
);

// ── telegram (lead-scoped) — literal-prefixed by :leadId ──────────────────────────────────
router.post(
  "/client-leads/:leadId/telegram/new",
  AuthMiddleware.requirePermissions([P.TELEGRAM_MANAGE]),
  validate(AdminLeadsValidation.leadIdParam, "params"),
  AuthMiddleware.requireSpecialChecker(adminLeadsController.checkIfUserCanMutateLead),
  asyncHandler(adminLeadsController.createTelegramLink),
);
router.post(
  "/client-leads/:leadId/telegram/assign-users",
  AuthMiddleware.requirePermissions([P.TELEGRAM_MANAGE]),
  validate(AdminLeadsValidation.leadIdParam, "params"),
  AuthMiddleware.requireSpecialChecker(adminLeadsController.checkIfUserCanMutateLead),
  asyncHandler(adminLeadsController.assignTelegramUsers),
);

// ── admin create new lead ─────────────────────────────────────────────────────────────────
router.post(
  "/new-lead",
  AuthMiddleware.requirePermissions([P.LEAD_CREATE]),
  validate(AdminLeadsValidation.createNewLead),
  asyncHandler(adminLeadsController.createNewLead),
);

export { router as adminLeadsRouter };
