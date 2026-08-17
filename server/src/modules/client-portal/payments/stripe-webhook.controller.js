import { clientPortalMessagesCodes, messagesNames } from "@dms/shared";
import { ok } from "../../../shared/http/response.js";
import { paymentsUsecase } from "./payments.usecase.js";

const TK = messagesNames.clientPortalMessages;

class StripeWebhookController {
  async handle(req, res) {
    const data = await paymentsUsecase.handleWebhook({
      rawBody: req.body,
      signature: req.get("stripe-signature"),
    });
    return ok(res, data, clientPortalMessagesCodes.PAYMENT_VERIFIED, TK);
  }
}

export const stripeWebhookController = new StripeWebhookController();
