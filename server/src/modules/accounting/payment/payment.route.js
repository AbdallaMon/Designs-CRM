// Payment routes mounted under /v2/accounting/payments. Every workflow action declares
// a permission code, verifies the payment exists, and validates money input strictly.
//
// Canonical workflow actions:
//   POST /payments/pay/:paymentId       → POST /payments/:paymentId/actions/pay
//   POST /payments/overdue/:paymentId   → POST /payments/:paymentId/actions/mark-overdue
//   PUT  /payments/status/:paymentId    → POST /payments/:paymentId/actions/change-status
//
// ROUTE ORDER: literal/sub-resource paths are declared BEFORE the `/:paymentId/actions/*`
// forms; Express matches in declaration order.
import { Router } from "express";
import { AuthMiddleware } from "../../../shared/middlewares/auth.middleware.js";
import { asyncHandler } from "../../../shared/middlewares/async-handler.js";
import { validate } from "../../../shared/middlewares/validate.middleware.js";
import { PERMISSIONS } from "@dms/shared";
import { paymentController } from "./payment.controller.js";
import { PaymentValidation } from "./payment.validation.js";

const P = PERMISSIONS.ACCOUNTING;
const router = Router();

// ── list / invoices (reads) ──────────────────────────────────────────────────────
router.get("/", AuthMiddleware.requirePermissions([P.PAYMENT_LIST]), asyncHandler(paymentController.getPayments));

router.get(
  "/:paymentId/invoices",
  AuthMiddleware.requirePermissions([P.PAYMENT_LIST]),
  validate(PaymentValidation.paymentIdParams, "params"),
  AuthMiddleware.requireSpecialChecker(paymentController.checkPaymentExists),
  asyncHandler(paymentController.listInvoices),
);

// ── money workflow actions ─────────────────────────────────────────────────────────
router.post(
  "/:paymentId/actions/pay",
  AuthMiddleware.requirePermissions([P.PAYMENT_PROCESS]),
  validate(PaymentValidation.paymentIdParams, "params"),
  AuthMiddleware.requireSpecialChecker(paymentController.checkPaymentExists),
  validate(PaymentValidation.pay),
  asyncHandler(paymentController.pay),
);

router.post(
  "/:paymentId/actions/mark-overdue",
  AuthMiddleware.requirePermissions([P.PAYMENT_MARK_OVERDUE]),
  validate(PaymentValidation.paymentIdParams, "params"),
  AuthMiddleware.requireSpecialChecker(paymentController.checkPaymentExists),
  asyncHandler(paymentController.markOverdue),
);

router.post(
  "/:paymentId/actions/change-status",
  AuthMiddleware.requirePermissions([P.PAYMENT_CHANGE_LEVEL]),
  validate(PaymentValidation.paymentIdParams, "params"),
  AuthMiddleware.requireSpecialChecker(paymentController.checkPaymentExists),
  validate(PaymentValidation.changeStatus),
  asyncHandler(paymentController.changeStatus),
);

export { router as paymentRouter };
