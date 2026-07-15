// my-day routes — mounted under `/v2/my-day`. Read-only surface.
//   GET /            my_day.view       — the caller's own queue (sales tiers + designers;
//                                        admins do NOT hold this code — no personal queue)
//   GET /team        my_day.team.view  — supervisor rollup (SUPER_SALES sales-only,
//                                        ADMIN/SUPER_ADMIN all domains — gated in usecase)
//   GET /unclaimed   my_day.team.view  — the aging unclaimed leads behind the team lens'
//                                        LEAD_UNCLAIMED_AGING exception (sales-domain)
//   GET /users/:id   my_day.team.view + object scope (SUPER_SALES → sales targets only)
import { Router } from "express";
import { AuthMiddleware } from "../../shared/middlewares/auth.middleware.js";
import { asyncHandler } from "../../shared/middlewares/async-handler.js";
import { validate } from "../../shared/middlewares/validate.middleware.js";
import { PERMISSIONS } from "@dms/shared";
import { myDayController } from "./my-day.controller.js";
import { MyDayValidation } from "./my-day.validation.js";

const P = PERMISSIONS.MY_DAY;
const router = Router();

router.use(AuthMiddleware.requireAuth);

router.get("/", AuthMiddleware.requirePermissions([P.VIEW]), asyncHandler(myDayController.getMyQueue));

router.get("/team", AuthMiddleware.requirePermissions([P.TEAM_VIEW]), asyncHandler(myDayController.getTeam));

router.get("/unclaimed", AuthMiddleware.requirePermissions([P.TEAM_VIEW]), asyncHandler(myDayController.getUnclaimed));

router.get(
  "/users/:userId",
  AuthMiddleware.requirePermissions([P.TEAM_VIEW]),
  validate(MyDayValidation.userIdParams, "params"),
  AuthMiddleware.requireSpecialChecker(myDayController.checkTargetScope),
  asyncHandler(myDayController.getUserQueue),
);

export { router as myDayRouter };
