// accounting/payment controller — thin. Reads validated input, delegates to the
// usecase, responds via the shared envelope. No business logic. The `checkPaymentExists`
// method is the object guard wired with requireSpecialChecker (it THROWS 404 on a
// missing payment and stashes the loaded state on req.scoped).
import { ok } from "../../../shared/http/response.js";
import { accountingMessagesCodes, messagesNames } from "@dms/shared";
import { paymentUsecase } from "./payment.usecase.js";
import { withPaymentListCapabilities, computePaymentCapabilities } from "./payment.dto.js";

const TK = messagesNames.accountingMessages;

import { paginate } from "../../../shared/utility/pagination.js";

class PaymentController {
  // object guard (existence) for the money workflow actions
  checkPaymentExists(req) {
    return paymentUsecase.checkPaymentExists({ paymentId: req.params.paymentId });
  }

  async getPayments(req, res) {
    const { page, limit, skip } = paginate(req.query);
    const result = await paymentUsecase.listPayments({ query: req.query, skip, limit, page });
    const items = withPaymentListCapabilities(result.data ?? [], req.auth);
    return ok(
      res,
      { items, total: result.total ?? 0, page, pageSize: limit },
      accountingMessagesCodes.PAYMENTS_FETCHED,
      TK,
    );
  }

  async listInvoices(req, res) {
    const data = await paymentUsecase.listInvoices({ paymentId: req.params.paymentId });
    return ok(res, { items: data }, accountingMessagesCodes.PAYMENT_INVOICES_FETCHED, TK);
  }

  async pay(req, res) {
    const data = await paymentUsecase.pay({
      paymentId: req.params.paymentId,
      body: req.body,
      authUser: req.auth,
    });
    return ok(res, { ...data, capabilities: computePaymentCapabilities(data, req.auth) }, accountingMessagesCodes.PAYMENT_PROCESSED, TK);
  }

  async markOverdue(req, res) {
    const data = await paymentUsecase.markOverdue({ paymentId: req.params.paymentId });
    return ok(res, { ...data, capabilities: computePaymentCapabilities(data, req.auth) }, accountingMessagesCodes.PAYMENT_MARKED_OVERDUE, TK);
  }

  async changeStatus(req, res) {
    const data = await paymentUsecase.changeStatus({ paymentId: req.params.paymentId, body: req.body });
    return ok(res, { ...data, capabilities: computePaymentCapabilities(data, req.auth) }, accountingMessagesCodes.PAYMENT_LEVEL_CHANGED, TK);
  }
}

export const paymentController = new PaymentController();
export { PaymentController };
