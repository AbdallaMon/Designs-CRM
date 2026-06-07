// accounting/payment controller — thin. Reads validated input, delegates to the
// usecase, responds via the shared envelope. No business logic. The `checkPaymentExists`
// method is the object guard wired with requireSpecialChecker (it THROWS 404 on a
// missing payment and stashes the loaded state on req.scoped).
import { ok } from "../../../shared/http/response.js";
import { accountingMessagesCodes, messagesNames } from "@dms/shared";
import { paymentUsecase } from "./payment.usecase.js";
import { withPaymentListCapabilities, computePaymentCapabilities } from "./payment.dto.js";

const C = accountingMessagesCodes;
const TK = messagesNames.accountingMessages;

// Legacy default pagination: page=1, limit=10 (services/main/utility getPagination).
function paginate(query) {
  const page = parseInt(query.page, 10) || 1;
  const limit = parseInt(query.limit, 10) || 10;
  return { page, limit, skip: (page - 1) * limit };
}

export class PaymentController {
  /** @param {import("./payment.usecase.js").PaymentUsecase} usecase */
  constructor(usecase) {
    this.usecase = usecase;
  }

  // object guard (existence) for the money workflow actions
  checkPaymentExists = (req) => this.usecase.checkPaymentExists({ paymentId: req.params.paymentId });

  list = async (req, res) => {
    const { page, limit, skip } = paginate(req.query);
    const result = await this.usecase.list({ query: req.query, skip, limit, page });
    const items = withPaymentListCapabilities(result.data ?? [], req.auth);
    return ok(
      res,
      { items, total: result.total ?? 0, page, pageSize: limit },
      C.PAYMENTS_FETCHED,
      TK,
    );
  };

  listInvoices = async (req, res) => {
    const data = await this.usecase.listInvoices({ paymentId: req.params.paymentId });
    return ok(res, { items: data }, C.PAYMENT_INVOICES_FETCHED, TK);
  };

  pay = async (req, res) => {
    const data = await this.usecase.pay({
      paymentId: req.params.paymentId,
      body: req.body,
      authUser: req.auth,
    });
    return ok(res, { ...data, capabilities: computePaymentCapabilities(data, req.auth) }, C.PAYMENT_PROCESSED, TK);
  };

  markOverdue = async (req, res) => {
    const data = await this.usecase.markOverdue({ paymentId: req.params.paymentId });
    return ok(res, { ...data, capabilities: computePaymentCapabilities(data, req.auth) }, C.PAYMENT_MARKED_OVERDUE, TK);
  };

  changeStatus = async (req, res) => {
    const data = await this.usecase.changeStatus({ paymentId: req.params.paymentId, body: req.body });
    return ok(res, { ...data, capabilities: computePaymentCapabilities(data, req.auth) }, C.PAYMENT_LEVEL_CHANGED, TK);
  };
}

export const paymentController = new PaymentController(paymentUsecase);
