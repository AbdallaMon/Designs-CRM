import { Router } from "express";
import { AuthMiddleware } from "../../../shared/middlewares/auth.middleware.js";
import { asyncHandler } from "../../../shared/middlewares/async-handler.js";
import { validate } from "../../../shared/middlewares/validate.middleware.js";
import { PERMISSIONS } from "@dms/shared";
import { contractUtilityController } from "./contract-utility.controller.js";
import { ContractUtilityValidation } from "./contract-utility.validation.js";

const P = PERMISSIONS.SITE_UTILITY;

// The contract-utility editor (legacy `routes/site-utilities/contract-utilities.js`).
// Mounted UNDER the site-utility router (which already requires auth) at
// `/v2/site-utilities/contract-utility`. The parent router calls
// `AuthMiddleware.requireAuth` once; here we add the per-action contract_utility
// permission codes (granted to ADMIN / SUPER_ADMIN via SITE_UTILITY_ADMIN — matching
// the sibling site-utility surface). These are singleton/global config records, not
// per-owner objects, so no object-scope checker is needed.
const contractUtilityRouter = Router();

// ── Aggregate read ─────────────────────────────────────────────────────────────
contractUtilityRouter.get(
  "/details",
  AuthMiddleware.requirePermissions([P.CONTRACT_UTILITY_VIEW]),
  asyncHandler(contractUtilityController.getDetails),
);

// ── Obligations (ContractUtility singleton) ──────────────────────────────────────
contractUtilityRouter.get(
  "/obligations",
  AuthMiddleware.requirePermissions([P.CONTRACT_UTILITY_VIEW]),
  asyncHandler(contractUtilityController.getObligations),
);
contractUtilityRouter.post(
  "/obligations",
  AuthMiddleware.requirePermissions([P.CONTRACT_UTILITY_EDIT]),
  validate(ContractUtilityValidation.obligationsSchema),
  asyncHandler(contractUtilityController.saveObligations),
);
contractUtilityRouter.put(
  "/obligations",
  AuthMiddleware.requirePermissions([P.CONTRACT_UTILITY_EDIT]),
  validate(ContractUtilityValidation.obligationsSchema),
  asyncHandler(contractUtilityController.saveObligations),
);

// ── Stage clauses ────────────────────────────────────────────────────────────────
contractUtilityRouter.get(
  "/stage-clauses",
  AuthMiddleware.requirePermissions([P.CONTRACT_UTILITY_VIEW]),
  asyncHandler(contractUtilityController.listStageClauses),
);
contractUtilityRouter.post(
  "/stage-clauses",
  AuthMiddleware.requirePermissions([P.CONTRACT_UTILITY_EDIT]),
  validate(ContractUtilityValidation.createStageClauseSchema),
  asyncHandler(contractUtilityController.createStageClause),
);
contractUtilityRouter.put(
  "/stage-clauses/:clauseId",
  AuthMiddleware.requirePermissions([P.CONTRACT_UTILITY_EDIT]),
  validate(ContractUtilityValidation.idParams, "params"),
  validate(ContractUtilityValidation.updateStageClauseSchema),
  asyncHandler(contractUtilityController.updateStageClause),
);
contractUtilityRouter.delete(
  "/stage-clauses/:clauseId",
  AuthMiddleware.requirePermissions([P.CONTRACT_UTILITY_EDIT]),
  validate(ContractUtilityValidation.idParams, "params"),
  asyncHandler(contractUtilityController.deleteStageClause),
);

// ── Special clauses ──────────────────────────────────────────────────────────────
contractUtilityRouter.get(
  "/special-clauses",
  AuthMiddleware.requirePermissions([P.CONTRACT_UTILITY_VIEW]),
  asyncHandler(contractUtilityController.listSpecialClauses),
);
contractUtilityRouter.post(
  "/special-clauses",
  AuthMiddleware.requirePermissions([P.CONTRACT_UTILITY_EDIT]),
  validate(ContractUtilityValidation.createSpecialClauseSchema),
  asyncHandler(contractUtilityController.createSpecialClause),
);
contractUtilityRouter.put(
  "/special-clauses/:clauseId",
  AuthMiddleware.requirePermissions([P.CONTRACT_UTILITY_EDIT]),
  validate(ContractUtilityValidation.idParams, "params"),
  validate(ContractUtilityValidation.updateSpecialClauseSchema),
  asyncHandler(contractUtilityController.updateSpecialClause),
);
contractUtilityRouter.delete(
  "/special-clauses/:clauseId",
  AuthMiddleware.requirePermissions([P.CONTRACT_UTILITY_EDIT]),
  validate(ContractUtilityValidation.idParams, "params"),
  asyncHandler(contractUtilityController.deleteSpecialClause),
);

// ── Level clauses ────────────────────────────────────────────────────────────────
contractUtilityRouter.get(
  "/level-clauses",
  AuthMiddleware.requirePermissions([P.CONTRACT_UTILITY_VIEW]),
  asyncHandler(contractUtilityController.listLevelClauses),
);
contractUtilityRouter.post(
  "/level-clauses",
  AuthMiddleware.requirePermissions([P.CONTRACT_UTILITY_EDIT]),
  validate(ContractUtilityValidation.createLevelClauseSchema),
  asyncHandler(contractUtilityController.createLevelClause),
);
contractUtilityRouter.put(
  "/level-clauses/:clauseId",
  AuthMiddleware.requirePermissions([P.CONTRACT_UTILITY_EDIT]),
  validate(ContractUtilityValidation.idParams, "params"),
  validate(ContractUtilityValidation.updateLevelClauseSchema),
  asyncHandler(contractUtilityController.updateLevelClause),
);
contractUtilityRouter.delete(
  "/level-clauses/:clauseId",
  AuthMiddleware.requirePermissions([P.CONTRACT_UTILITY_EDIT]),
  validate(ContractUtilityValidation.idParams, "params"),
  asyncHandler(contractUtilityController.deleteLevelClause),
);

export { contractUtilityRouter };
