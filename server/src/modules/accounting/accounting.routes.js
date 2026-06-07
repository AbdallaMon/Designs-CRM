// accounting — aggregate router for the MONEY-sensitive accountant surface (legacy
// `/accountant/*`, kept mounted in parallel during the strangler window). Mounted under
// `/v2/accounting`. Authentication is mounted ONCE here; each sub-router declares its
// per-route permission codes (ACCOUNTING.*), granted to the ACCOUNTANT role only — exactly
// reproducing the legacy `verifyTokenAndHandleAuthorization(..., "ACCOUNTANT")` gate
// (VERIFIED: that gate admits ONLY the ACCOUNTANT base role; ADMIN/SUPER_ADMIN/isSuperSales
// are NOT admitted by the accountant router today).
//
// Sub-surface → mount (legacy → v2):
//   /accountant/payments*              → /v2/accounting/payments
//   /accountant/notes                  → /v2/accounting/notes
//   /accountant/operational-expenses   → /v2/accounting/operational-expenses
//   /accountant/rents*                 → /v2/accounting/rents
//   /accountant/outcome                → /v2/accounting/outcome
//   /accountant/summary                → /v2/accounting/summary
//   /accountant/users*                 → /v2/accounting/users
//   /accountant/salaries*              → /v2/accounting/salaries
import { Router } from "express";
import { AuthMiddleware } from "../../shared/middlewares/auth.middleware.js";
import { paymentRouter } from "./payment/payment.routes.js";
import { noteRouter } from "./note/note.routes.js";
import { expenseRouter } from "./expense/expense.routes.js";
import { rentRouter } from "./rent/rent.routes.js";
import { outcomeRouter, summaryRouter } from "./report/report.routes.js";
import { accountingUsersRouter } from "./salary/accounting-users.routes.js";
import { salaryRouter } from "./salary/salary.routes.js";

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
