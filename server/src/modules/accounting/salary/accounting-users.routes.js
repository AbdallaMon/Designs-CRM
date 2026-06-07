// accounting/salary — accountant-scoped USER helper lists (legacy `/accountant/users` and
// `/accountant/users/:userId/last-seen`). Mounted under `/v2/accounting/users`. These are
// the salary-support directory/activity reads the legacy ACCOUNTANT router exposed; they
// are intentionally NOT coupled to the users module (behavior is kept 1:1 with the legacy
// accountant versions). Auth once at the parent router.
//
// ROUTE ORDER: `/:userId/last-seen` is the only `/:` route; the bare `/` is declared first.
import { Router } from "express";
import { AuthMiddleware } from "../../../shared/middlewares/auth.middleware.js";
import { asyncHandler } from "../../../shared/middlewares/async-handler.js";
import { validate } from "../../../shared/middlewares/validate.middleware.js";
import { PERMISSIONS } from "@dms/shared";
import { salaryController } from "./salary.controller.js";
import { SalaryValidation } from "./salary.validation.js";

const P = PERMISSIONS.ACCOUNTING;
const router = Router();

router.get("/", AuthMiddleware.requirePermissions([P.USER_LIST]), asyncHandler(salaryController.listUsers));

router.get(
  "/:userId/last-seen",
  AuthMiddleware.requirePermissions([P.USER_LAST_SEEN]),
  validate(SalaryValidation.userIdParams, "params"),
  asyncHandler(salaryController.userLastSeen),
);

export { router as accountingUsersRouter };
