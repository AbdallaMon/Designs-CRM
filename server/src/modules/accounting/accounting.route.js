// Money-sensitive accounting API mounted under /v2/accounting. Authentication is
// applied once here; each sub-router declares its action-specific permission code.
// ACCOUNTANT profiles receive the accounting set, while ADMIN/SUPER_ADMIN receive all.
//   /accountant/salaries*              → /v2/accounting/salaries
import { Router } from "express";
import { AuthMiddleware } from "../../shared/middlewares/auth.middleware.js";
import { paymentRouter } from "./payment/payment.route.js";
import { noteRouter } from "./note/note.route.js";
import { expenseRouter } from "./expense/expense.route.js";
import { rentRouter } from "./rent/rent.route.js";
import { outcomeRouter, summaryRouter } from "./report/report.route.js";
import { accountingUsersRouter } from "./salary/accounting-users.route.js";
import { salaryRouter } from "./salary/salary.route.js";

const router = Router();

// Authentication mounted once for the whole accounting surface.
router.use(AuthMiddleware.requireAuth);

router.use("/payments", paymentRouter);
router.use("/notes", noteRouter);
router.use("/operational-expenses", expenseRouter);
router.use("/rents", rentRouter);
router.use("/outcome", outcomeRouter);
router.use("/summary", summaryRouter);
router.use("/users", accountingUsersRouter);
router.use("/salaries", salaryRouter);

export { router as accountingRouter };
