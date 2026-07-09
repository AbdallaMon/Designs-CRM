// accounting/expense routes — operational expenses (legacy `/accountant/operational-expenses`).
// Mounted under `/v2/accounting/operational-expenses`. Auth once at the parent router.
import { Router } from "express";
import { AuthMiddleware } from "../../../shared/middlewares/auth.middleware.js";
import { asyncHandler } from "../../../shared/middlewares/async-handler.js";
import { validate } from "../../../shared/middlewares/validate.middleware.js";
import { PERMISSIONS } from "@dms/shared";
import { expenseController } from "./expense.controller.js";
import { ExpenseValidation } from "./expense.validation.js";

const P = PERMISSIONS.ACCOUNTING;
const router = Router();

router.get("/", AuthMiddleware.requirePermissions([P.EXPENSE_LIST]), asyncHandler(expenseController.list));
router.post(
  "/",
  AuthMiddleware.requirePermissions([P.EXPENSE_CREATE]),
  validate(ExpenseValidation.create),
  asyncHandler(expenseController.create),
);

export { router as expenseRouter };
