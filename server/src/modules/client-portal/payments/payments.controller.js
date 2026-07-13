// client-portal/payments controller — thin. PUBLIC client Stripe checkout. Responds via the
// shared envelope with language-neutral codes, REPLACING the legacy prose
// ("Payment verified", "Payment not completed"). The `/pay` legacy response was a bare
// `{ url }`; we keep `url` inside `data` so the FE redirect target is preserved. The
// not-completed branch keeps the legacy 402 status.
import { ok } from "../../../shared/http/response.js";
import { clientPortalMessagesCodes, messagesNames } from "@dms/shared";
import { paymentsUsecase } from "./payments.usecase.js";

const TK = messagesNames.clientPortalMessages;

class PaymentsController {
  async pay(req, res) {
    const data = await paymentsUsecase.pay({
      clientId: req.body.clientId,
      clientLeadId: req.body.clientLeadId,
      lng: req.body.lng,
    });
    return ok(res, data, clientPortalMessagesCodes.PAYMENT_CHECKOUT_CREATED, TK);
  }

  async paymentStatus(req, res) {
    const result = await paymentsUsecase.paymentStatus({
      sessionId: req.query.sessionId,
      clientLeadId: req.query.clientLeadId,
      lng: req.query.lng,
    });

    if (!result.paid) {
      // Preserve the legacy 402 for an unpaid session.
      return res.status(402).json({
        success: false,
        message: clientPortalMessagesCodes.PAYMENT_NOT_COMPLETED,
        data: { paymentStatus: "ERROR" },
        translationKey: TK,
      });
    }

    return ok(
      res,
      { paymentStatus: "PAID", session: result.session, kv: result.kv },
      clientPortalMessagesCodes.PAYMENT_VERIFIED,
      TK,
    );
  }

  async backfill(req, res) {
    const data = await paymentsUsecase.backfill({ pass: req.query.pass });
    return ok(res, data, clientPortalMessagesCodes.PAYMENT_BACKFILL_DONE, TK);
  }
}

export const paymentsController = new PaymentsController();
export { PaymentsController };
