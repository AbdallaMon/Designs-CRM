// client-portal/payments route — PUBLIC client Stripe checkout. Legacy
// `routes/client/payments.js` (`POST /pay`, `GET /payment-status`, `GET /stripe/backfill`),
// mounted PATHLESS under `/client`. Mounted under v2 at `/v2/client/pay`,
// `/v2/client/payment-status`, `/v2/client/stripe/backfill` (paths preserved 1:1).
//
// PUBLIC BY DESIGN — a prospective client pays the booking fee before any login session,
// exactly like legacy and the booking funnel. 🔒 Stripe SDK calls are frozen (relocated
// verbatim). No webhook/signature logic exists in this flow. `/stripe/backfill` keeps the
// legacy secret-key gate. The payment-status verification now derives the target lead from
// the VERIFIED Stripe session metadata (IDOR close — see usecase).
import { Router } from "express";
import { asyncHandler } from "../../../shared/middlewares/async-handler.js";
import { validate } from "../../../shared/middlewares/validate.middleware.js";
import { paymentsController } from "./payments.controller.js";
import { PaymentsValidation } from "./payments.validation.js";

const router = Router();

router.post("/pay", validate(PaymentsValidation.pay), asyncHandler(paymentsController.pay));
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
