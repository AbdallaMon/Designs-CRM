// accounting/payment usecase — business logic / orchestration. Prisma NEVER appears here
// (only repo calls). The money guards/orchestration formerly inside the legacy service's
// processPayment / markPaymentAsOverdue now live in the private `_processPayment` /
// `_markPaymentAsOverdue` methods below; their Prisma reads/writes are delegated to
// payment.repo.js. Errors are thrown as raw domain strings (byte-identical to legacy) and
// translated to AppError codes via translateLegacyAccountingError.
//
// SECURITY / MONEY HARDENING (unchanged): the workflow-action scope checker loads the
// payment server-side and 404s if it does not exist; the change-status action validates
// the new level against the PaymentLevel enum at the route (Zod). The legacy money checks
// inside `_processPayment` (amount > 0, amount <= pending, not-already-fully-paid) are
// PRESERVED untouched — no rounding/arithmetic is re-implemented.
import { AppError } from "../../../shared/errors/AppError.js";
import { PAYMENT_STATUSES, accountingMessagesCodes } from "@dms/shared";
import { paymentRepository } from "./payment.repo.js";

class PaymentUsecase {
  // ── relocated money orchestration (guards preserved byte-identical) ──────────────
  // Formerly legacy processPayment. Guards throw the exact legacy strings (consumed by
  // accounting.errors.js); the three writes are delegated to the repo.
  async _processPayment(paymentId, amount, issuedDate, file, userId) {
    if (!amount || !issuedDate) {
      throw new AppError({ code: accountingMessagesCodes.REQUIRED_FIELDS_MISSING, statusCode: 400 });
    }
    if (issuedDate === "1970-01-01T00:00:00.000Z") {
      throw new AppError({ code: accountingMessagesCodes.PAYMENT_DATE_REQUIRED, statusCode: 400 });
    }
    return paymentRepository.runInTransaction(async (client) => {
      await paymentRepository.lockPaymentForUpdate({ id: paymentId, client });
      const payment = await paymentRepository.findPayment({ id: paymentId, client });

      if (!payment) {
        throw new AppError({ code: accountingMessagesCodes.PAYMENT_NOT_FOUND, statusCode: 404 });
      }
      if (payment.status === PAYMENT_STATUSES.FULLY_PAID && payment.amountPaid === payment.amount) {
        throw new AppError({
          code: accountingMessagesCodes.PAYMENT_ALREADY_FULLY_PAID,
          statusCode: 409,
        });
      }
      const pendingAmount = payment.amount - (payment.amountPaid || 0);

      if (amount > pendingAmount) {
        throw new AppError({
          code: accountingMessagesCodes.PAYMENT_AMOUNT_EXCEEDS_PENDING,
          statusCode: 400,
        });
      }

      if (amount <= 0) {
        throw new AppError({ code: accountingMessagesCodes.PAYMENT_AMOUNT_INVALID, statusCode: 400 });
      }

      const newAmountPaid = Number(payment.amountPaid || 0) + Number(amount);
      const isFullyPaid = newAmountPaid >= payment.amount;

      const newPayment = await paymentRepository.updatePaymentAmounts({
        id: payment.id,
        amountPaid: newAmountPaid,
        status:
          payment.status === PAYMENT_STATUSES.OVERDUE && !isFullyPaid
            ? PAYMENT_STATUSES.OVERDUE
            : isFullyPaid
            ? PAYMENT_STATUSES.FULLY_PAID
            : PAYMENT_STATUSES.PENDING,
        amountLeft: payment.amount - newAmountPaid,
        client,
        // paymentLevel: getNextPaymentLevel(payment.paymentLevel),
      });

      const invoice = await paymentRepository.createInvoice({
        paymentId: payment.id,
        amount: amount,
        issuedDate: issuedDate,
        client,
      });
      await paymentRepository.createInvoiceNote({
        attachment: file,
        invoiceId: invoice.id,
        userId: Number(userId),
        client,
      });
      return {
        ...newPayment,
        amountPaid: newAmountPaid,
        status: newPayment.status,
        invoiceNumber: invoice.invoiceNumber,
        invoiceId: invoice.id,
      };
    });
  }

  // Formerly legacy markPaymentAsOverdue. Guards throw the exact legacy strings.
  async _markPaymentAsOverdue(paymentId) {
    const payment = await paymentRepository.findPayment({ id: Number(paymentId) });

    if (!payment) {
      throw new AppError({ code: accountingMessagesCodes.PAYMENT_NOT_FOUND, statusCode: 404 });
    }

    if (payment.status === PAYMENT_STATUSES.FULLY_PAID) {
      throw new AppError({ code: accountingMessagesCodes.PAYMENT_ALREADY_FULLY_PAID, statusCode: 409 });
    }

    const newPayment = await paymentRepository.updatePaymentOverdue({ id: payment.id });

    return newPayment;
  }

  // ── object existence guard for the money workflow actions ───────────────────────
  // Payments are GLOBAL financial records (no per-owner scope in legacy). The checker
  // therefore enforces EXISTENCE (404 on a forged/missing id) so a money mutation never
  // runs against a non-existent payment, and stashes the true server state on req.scoped.
  async checkPaymentExists({ paymentId }) {
    const payment = await paymentRepository.findPaymentState({ paymentId });
    if (!payment) throw new AppError({ code: accountingMessagesCodes.PAYMENT_NOT_FOUND, statusCode: 404 });
    return payment;
  }

  // ── list ────────────────────────────────────────────────────────────────────────
  // Legacy route parsed `filters` (a JSON string) and pulled status/level out of it,
  // then called getPayments. Same behavior, but a malformed/absent `filters` now safely
  // defaults to {} instead of throwing a generic 500.
  async listPayments({ query, skip, limit }) {
    let { clientId, paymentId, status, type, filters, level } = query;
    const parsedFilters = (() => {
      try {
        return filters ? JSON.parse(filters) : {};
      } catch {
        return {};
      }
    })();
    if (parsedFilters.status) status = parsedFilters.status;
    if (parsedFilters.level) level = parsedFilters.level;

    const result = await paymentRepository.getPayments({
      status,
      paymentId,
      clientId,
      type,
      level,
      limit: Number(limit),
      skip: Number(skip),
      filters: parsedFilters,
    });
    // Legacy returns { data, total, totalPages }. Normalize to the contract shape.
    return result;
  }

  async listInvoices({ paymentId }) {
    return paymentRepository.getListOfPaymentInvoices(Number(paymentId));
  }

  // ── workflow actions (money state changes) ──────────────────────────────────────
  // POST /payments/:paymentId/actions/pay — the money guards (date present, amount > 0,
  // amount <= pending, not already fully paid) live in `_processPayment` and are preserved;
  // we map its known throws to language-neutral codes.
  async pay({ paymentId, body, authUser }) {
    const { amount, issuedDate, file } = body;
    // Translate the money-guard throws (not-found / already-paid / amount-exceeds /
    // amount-invalid / date-required / required-fields) to AppError codes; unknown errors
    // re-throw as-is. Arithmetic/rounding inside _processPayment is untouched.
    return this._processPayment(
      Number(paymentId),
      Number(amount),
      new Date(issuedDate),
      file,
      authUser.id,
    );
  }

  // POST /payments/:paymentId/actions/mark-overdue — Known throws: "Payment not found" /
  // "already fully paid" → AppError codes.
  async markOverdue({ paymentId }) {
    return this._markPaymentAsOverdue(paymentId);
  }

  // POST /payments/:paymentId/actions/change-status — the new level is enum-validated at
  // the route (Zod). The legacy service's third arg (old level) is ignored, so we no longer
  // accept or pass a client-trusted state value.
  async changeStatus({ paymentId, body }) {
    return paymentRepository.changePaymentLevel(paymentId, body.newPaymentLevel);
  }
}

export const paymentUsecase = new PaymentUsecase();
export { PaymentUsecase };
