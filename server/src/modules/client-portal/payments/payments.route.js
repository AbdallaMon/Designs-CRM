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
import { paymentsController as c } from "./payments.controller.js";
import { PaymentsValidation as V } from "./payments.validation.js";

const router = Router();

router.post("/pay", validate(V.pay), asyncHandler(c.pay));
router.get(
  "/payment-status",
  validate(V.statusQuery, "query"),
  asyncHandler(c.paymentStatus),
);
router.get(
  "/stripe/backfill",
  validate(V.backfillQuery, "query"),
  asyncHandler(c.backfill),
);

export { router as clientPaymentsRouter };
