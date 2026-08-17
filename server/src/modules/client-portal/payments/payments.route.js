// client-portal/payments route — PUBLIC client Stripe checkout. Legacy
// `routes/client/payments.js` (`POST /pay`, `GET /payment-status`, `GET /stripe/backfill`),
// mounted PATHLESS under `/client`. Mounted under v2 at `/v2/client/pay`,
// `/v2/client/payment-status`, `/v2/client/stripe/backfill` (paths preserved 1:1).
//
// PUBLIC BY DESIGN — a prospective client pays before any login session. Checkout creation
// requires the short-lived PUBLIC_REGISTER capability bound to the requested lead. Stripe
// webhook fulfillment is signature verified; browser payment-status only reconciles a
// server-retrieved session and derives its lead from Stripe metadata.
import { Router } from "express";
import { asyncHandler } from "../../../shared/middlewares/async-handler.js";
import { validate } from "../../../shared/middlewares/validate.middleware.js";
import { paymentsController } from "./payments.controller.js";
import { PaymentsValidation } from "./payments.validation.js";
import { AuthMiddleware } from "../../../shared/middlewares/auth.middleware.js";
import { checkoutCreationLimiter } from "./payments.rate-limiter.js";
import { stripeWebhookRouter } from "./stripe-webhook.route.js";

const router = Router();

router.use("/stripe", stripeWebhookRouter);
router.post(
  "/pay",
  checkoutCreationLimiter,
  validate(PaymentsValidation.pay),
  AuthMiddleware.requireSpecialChecker(paymentsController.authorizePay),
  asyncHandler(paymentsController.pay),
);
router.get(
  "/payment-status",
  validate(PaymentsValidation.statusQuery, "query"),
  asyncHandler(paymentsController.paymentStatus),
);
router.get(
  "/stripe/backfill",
  validate(PaymentsValidation.backfillQuery, "query"),
  asyncHandler(paymentsController.backfill),
);

export { router as clientPaymentsRouter };
