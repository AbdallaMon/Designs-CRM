// contracts/contract routes — the authed staff/admin contract CRUD surface (legacy
// `routes/contract/contracts.js`, mounted `/shared/contracts` behind the SHARED gate = all
// 9 authed roles). Mounted here under `/v2/contracts`. Authentication is mounted ONCE;
// every route declares its CONTRACT.* code (granted to every authed role via SHARED_AUTHED
// — reproducing the legacy SHARED gate exactly).
//
// OBJECT SCOPE (the IDOR fix the legacy routes were MISSING): Contract rows are
// lead-scoped. No route-level requireSpecialChecker — the check is in the usecase, which
// resolves the parent clientLead (directly for :leadId, or via contract→clientLeadId for
// :contractId / child ids) and runs the leads-module checker (access for reads, mutate for
// writes) before any read/write.
//
// ROUTE ORDERING: the literal `/payments/all` and `/payments/:paymentId/*` sub-paths are
// declared BEFORE `/:contractId` so they are not shadowed by the contract-id param route.
//
// Endpoint map (legacy → v2). RENAMES flagged [R] (FE must repoint):
//   GET    /client-lead/:leadId                          → same
//   POST   /                                             → same
//   GET    /payments/all                                 → same
//   POST   /payments/:paymentId/status                   → POST /payments/:paymentId/actions/change-status   [R]
//   POST   /payments/:paymentId/amounts                  → POST /payments/:paymentId/actions/update-amounts  [R]
//   GET    /:contractId                                  → same
//   PATCH  /:contractId/cancel                           → POST /:contractId/actions/cancel                  [R]
//   PUT    /:contractId/basics                           → same
//   PATCH  /:contractId                                  → POST /:contractId/actions/generate-pdf-token      [R]
//   POST   /:contractId/stages                           → same
//   PUT    /:contractId/stages/:stageId                  → same
//   DELETE /:contractId/stages/:stageId                  → same
//   POST   /:contractId/payments/:paymentId/status       → POST /:contractId/payments/:paymentId/actions/change-status [R]
//   POST   /:contractId/payments                         → same
//   PUT    /:contractId/payments/:paymentId              → same
//   DELETE /:contractId/payments/:paymentId              → same
//   POST   /:contractId/drawings                         → same
//   PUT    /:contractId/drawings/:drawId                 → same
//   DELETE /:contractId/drawings/:drawId                 → same
//   POST   /:contractId/special-items                    → same
//   PUT    /:contractId/special-items/:itemId            → same
//   DELETE /:contractId/special-items/:itemId            → same
import { Router } from "express";
import { AuthMiddleware } from "../../../shared/middlewares/auth.middleware.js";
import { asyncHandler } from "../../../shared/middlewares/async-handler.js";
import { validate } from "../../../shared/middlewares/validate.middleware.js";
import { PERMISSIONS } from "@dms/shared";
import { contractController } from "./contract.controller.js";
import { ContractValidation } from "./contract.validation.js";

const P = PERMISSIONS.CONTRACT;
const router = Router();

router.use(AuthMiddleware.requireAuth);

// ── lead-scoped list + create ─────────────────────────────────────────────────────────
router.get(
  "/client-lead/:leadId",
  AuthMiddleware.requirePermissions([P.LIST]),
  validate(ContractValidation.leadIdParam, "params"),
  asyncHandler(contractController.listForLead),
);

router.post(
  "/",
  AuthMiddleware.requirePermissions([P.CREATE]),
  validate(ContractValidation.create),
  asyncHandler(contractController.create),
);

// ── grouped payments list (literal — declared before /:contractId) ──────────────────────
router.get(
  "/payments/all",
  AuthMiddleware.requirePermissions([P.PAYMENT_LIST]),
  validate(ContractValidation.paymentsListQuery, "query"),
  asyncHandler(contractController.paymentsGrouped),
);

// ── bare-payment workflow actions (no :contractId — legacy `/payments/:paymentId/*`) ────
router.post(
  "/payments/:paymentId/actions/change-status",
  AuthMiddleware.requirePermissions([P.PAYMENT_MANAGE]),
  validate(ContractValidation.paymentIdParam, "params"),
  validate(ContractValidation.changePaymentStatus),
  asyncHandler(contractController.updatePaymentStatus),
);

router.post(
  "/payments/:paymentId/actions/update-amounts",
  AuthMiddleware.requirePermissions([P.PAYMENT_MANAGE]),
  validate(ContractValidation.paymentIdParam, "params"),
  validate(ContractValidation.updatePaymentAmounts),
  asyncHandler(contractController.updatePaymentAmounts),
);

// ── contract detail + lifecycle actions ─────────────────────────────────────────────────
router.get(
  "/:contractId",
  AuthMiddleware.requirePermissions([P.VIEW]),
  validate(ContractValidation.contractIdParam, "params"),
  asyncHandler(contractController.getById),
);

router.post(
  "/:contractId/actions/cancel",
  AuthMiddleware.requirePermissions([P.CANCEL]),
  validate(ContractValidation.contractIdParam, "params"),
  asyncHandler(contractController.cancel),
);

router.put(
  "/:contractId/basics",
  AuthMiddleware.requirePermissions([P.EDIT]),
  validate(ContractValidation.contractIdParam, "params"),
  validate(ContractValidation.updateBasics),
  asyncHandler(contractController.updateBasics),
);

router.post(
  "/:contractId/actions/generate-pdf-token",
  AuthMiddleware.requirePermissions([P.GENERATE_PDF_TOKEN]),
  validate(ContractValidation.contractIdParam, "params"),
  asyncHandler(contractController.generatePdfToken),
);

// ── stages ────────────────────────────────────────────────────────────────────────────
router.post(
  "/:contractId/stages",
  AuthMiddleware.requirePermissions([P.STAGE_MANAGE]),
  validate(ContractValidation.contractIdParam, "params"),
  validate(ContractValidation.createStage),
  asyncHandler(contractController.createStage),
);

router.put(
  "/:contractId/stages/:stageId",
  AuthMiddleware.requirePermissions([P.STAGE_MANAGE]),
  validate(ContractValidation.contractStageParams, "params"),
  validate(ContractValidation.updateStage),
  asyncHandler(contractController.updateStage),
);

router.delete(
  "/:contractId/stages/:stageId",
  AuthMiddleware.requirePermissions([P.STAGE_MANAGE]),
  validate(ContractValidation.contractStageParams, "params"),
  asyncHandler(contractController.deleteStage),
);

// ── payments (contract-scoped) ──────────────────────────────────────────────────────────
router.post(
  "/:contractId/payments/:paymentId/actions/change-status",
  AuthMiddleware.requirePermissions([P.PAYMENT_MANAGE]),
  validate(ContractValidation.contractPaymentParams, "params"),
  validate(ContractValidation.changePaymentStatus),
  asyncHandler(contractController.updatePaymentStatus),
);

router.post(
  "/:contractId/payments",
  AuthMiddleware.requirePermissions([P.PAYMENT_MANAGE]),
  validate(ContractValidation.contractIdParam, "params"),
  validate(ContractValidation.createPayment),
  asyncHandler(contractController.createPayment),
);

router.put(
  "/:contractId/payments/:paymentId",
  AuthMiddleware.requirePermissions([P.PAYMENT_MANAGE]),
  validate(ContractValidation.contractPaymentParams, "params"),
  validate(ContractValidation.updatePayment),
  asyncHandler(contractController.updatePayment),
);

router.delete(
  "/:contractId/payments/:paymentId",
  AuthMiddleware.requirePermissions([P.PAYMENT_MANAGE]),
  validate(ContractValidation.contractPaymentParams, "params"),
  asyncHandler(contractController.deletePayment),
);

// ── drawings ────────────────────────────────────────────────────────────────────────────
router.post(
  "/:contractId/drawings",
  AuthMiddleware.requirePermissions([P.DRAWING_MANAGE]),
  validate(ContractValidation.contractIdParam, "params"),
  validate(ContractValidation.createDrawing),
  asyncHandler(contractController.createDrawing),
);

router.put(
  "/:contractId/drawings/:drawId",
  AuthMiddleware.requirePermissions([P.DRAWING_MANAGE]),
  validate(ContractValidation.contractDrawingParams, "params"),
  validate(ContractValidation.updateDrawing),
  asyncHandler(contractController.updateDrawing),
);

router.delete(
  "/:contractId/drawings/:drawId",
  AuthMiddleware.requirePermissions([P.DRAWING_MANAGE]),
  validate(ContractValidation.contractDrawingParams, "params"),
  asyncHandler(contractController.deleteDrawing),
);

// ── special items ────────────────────────────────────────────────────────────────────────
router.post(
  "/:contractId/special-items",
  AuthMiddleware.requirePermissions([P.SPECIAL_ITEM_MANAGE]),
  validate(ContractValidation.contractIdParam, "params"),
  validate(ContractValidation.createSpecialItem),
  asyncHandler(contractController.createSpecialItem),
);

router.put(
  "/:contractId/special-items/:itemId",
  AuthMiddleware.requirePermissions([P.SPECIAL_ITEM_MANAGE]),
  validate(ContractValidation.contractSpecialItemParams, "params"),
  validate(ContractValidation.updateSpecialItem),
  asyncHandler(contractController.updateSpecialItem),
);

router.delete(
  "/:contractId/special-items/:itemId",
  AuthMiddleware.requirePermissions([P.SPECIAL_ITEM_MANAGE]),
  validate(ContractValidation.contractSpecialItemParams, "params"),
  asyncHandler(contractController.deleteSpecialItem),
);

export { router as contractRouter };
