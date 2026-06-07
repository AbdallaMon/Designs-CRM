// accounting/salary routes — salaries (legacy `/accountant/salaries*`). Mounted under
// `/v2/accounting/salaries`. Auth once at the parent router.
//
// Salary create/pay keep their POST semantics (they CREATE records — a base salary, a
// monthly salary + outcome — not status transitions), named clearly by path. The legacy
// PUT /salaries/:id (edit a base salary) stays a plain field update (not a workflow action).
//
// ROUTE ORDER: literal `/data` and `/monthly/pay` are declared BEFORE `/:userId` /`/:id`
// so they are not shadowed (Express matches in declaration order).
import { Router } from "express";
import { AuthMiddleware } from "../../../shared/middlewares/auth.middleware.js";
import { asyncHandler } from "../../../shared/middlewares/async-handler.js";
import { validate } from "../../../shared/middlewares/validate.middleware.js";
import { PERMISSIONS } from "@dms/shared";
import { salaryController } from "./salary.controller.js";
import { SalaryValidation } from "./salary.validation.js";

const P = PERMISSIONS.ACCOUNTING;
const router = Router();

router.get(
  "/data",
  AuthMiddleware.requirePermissions([P.SALARY_VIEW]),
  asyncHandler(salaryController.salaryData),
);

router.post(
  "/monthly/pay",
  AuthMiddleware.requirePermissions([P.SALARY_PAY]),
  validate(SalaryValidation.payMonthly),
  asyncHandler(salaryController.payMonthly),
);

router.post(
  "/:userId",
  AuthMiddleware.requirePermissions([P.SALARY_CREATE]),
  validate(SalaryValidation.userIdParams, "params"),
  validate(SalaryValidation.createBase),
  asyncHandler(salaryController.createBase),
);

router.put(
  "/:id",
  AuthMiddleware.requirePermissions([P.SALARY_EDIT]),
  validate(SalaryValidation.idParams, "params"),
  validate(SalaryValidation.editBase),
  asyncHandler(salaryController.editBase),
);

export { router as salaryRouter };
