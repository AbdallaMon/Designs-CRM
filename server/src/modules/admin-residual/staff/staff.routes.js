// admin-residual/staff routes — the residual STAFF-gated endpoint (legacy
// `routes/staff/staff.js`, mounted `/staff` behind `verifyTokenAndHandleAuthorization(...,
// "STAFF")`). Mounted under `/v2/staff`. Auth is mounted ONCE here (this is a SEPARATE gate
// from the admin-residual aggregate — the STAFF gate admits a DIFFERENT role set), and the
// single route is gated by STAFF.LATEST_CALLS_VIEW, granted to EXACTLY the five base roles
// the legacy STAFF gate admits (STAFF / THREE_D_DESIGNER / TWO_D_DESIGNER / ACCOUNTANT /
// TWO_D_EXECUTOR) — NOT ADMIN/SUPER_ADMIN/SUPER_SALES/CONTACT_INITIATOR. The gate is the
// code; latest-calls is a call-reminder list (no per-record object to scope).
//
// Endpoint map (legacy → v2, path 1:1):
//   GET /dashboard/latest-calls → GET /v2/staff/dashboard/latest-calls (STAFF.LATEST_CALLS_VIEW)
import { Router } from "express";
import { AuthMiddleware } from "../../../shared/middlewares/auth.middleware.js";
import { asyncHandler } from "../../../shared/middlewares/async-handler.js";
import { validate } from "../../../shared/middlewares/validate.middleware.js";
import { PERMISSIONS } from "@dms/shared";
import { staffController } from "./staff.controller.js";
import { StaffValidation as V } from "./staff.validation.js";

const P = PERMISSIONS.STAFF;
const router = Router();

router.use(AuthMiddleware.requireAuth);

router.get(
  "/dashboard/latest-calls",
  AuthMiddleware.requirePermissions([P.LATEST_CALLS_VIEW]),
  validate(V.latestCallsQuery, "query"),
  asyncHandler(staffController.latestCalls),
);

export { router as staffRouter };
