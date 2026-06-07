// accounting/payment usecase — business logic / orchestration. Prisma NEVER appears
// here (only repo calls + lazy legacy adapters). Behavior is ported 1:1 from the legacy
// handlers (routes/accountant/accountant.js) + the accountant service
// (services/main/accountant/accountantServices.js). Errors are thrown as
// AppError(code, statusCode); the envelope serializes them.
//
// SECURITY / MONEY HARDENING vs legacy (additive, not behavior-changing for valid
// input): the workflow-action scope checker loads the payment server-side and 404s if
// it does not exist (so a forged id no longer hits the mutation service); the
// change-status action validates the new level against the PaymentLevel enum at the
// route (Zod) instead of trusting an arbitrary client string. The legacy money checks
// inside processPayment (amount > 0, amount <= pending, not-already-fully-paid) are
// PRESERVED untouched — we do not re-implement or change any rounding/arithmetic.
import { AppError } from "../../../shared/errors/AppError.js";
import { accountingMessagesCodes as C } from "@dms/shared";
import { paymentRepository } from "./payment.repository.js";

// Lazy adapters to the not-yet-migrated accountant service (behavior-preserving).
const legacyDefaults = {
  getPayments: (a) =>
    import("../../../../services/main/accountant/accountantServices.js").then((m) => m.getPayments(a)),
  getListOfPaymentInvoices: (id) =>
    import("../../../../services/main/accountant/accountantServices.js").then((m) =>
      m.getListOfPaymentInvoices(id),
    ),
  processPayment: (...a) =>
    import("../../../../services/main/accountant/accountantServices.js").then((m) =>
      m.processPayment(...a),
    ),
  markPaymentAsOverdue: (id) =>
    import("../../../../services/main/accountant/accountantServices.js").then((m) =>
      m.markPaymentAsOverdue(id),
    ),
  changePaymentLevel: (...a) =>
    import("../../../../services/main/accountant/accountantServices.js").then((m) =>
      m.changePaymentLevel(...a),
    ),
};

export class PaymentUsecase {
  /**
   * @param {import("./payment.repository.js").PaymentRepository} repository
   * @param {Partial<typeof legacyDefaults>} [legacy]
   */
  constructor(repository, legacy = {}) {
    this.repo = repository;
    this.legacy = { ...legacyDefaults, ...legacy };
  }

  // ── object existence guard for the money workflow actions ───────────────────────
  // Payments are GLOBAL financial records (no per-owner scope in legacy). The checker
  // therefore enforces EXISTENCE (404 on a forged/missing id) so a money mutation never
  // runs against a non-existent payment, and stashes the true server state on req.scoped.
  async checkPaymentExists({ paymentId }) {
    const payment = await this.repo.findPaymentState({ paymentId });
    if (!payment) throw new AppError(C.PAYMENT_NOT_FOUND, 404);
    return payment;
  }

  // ── list ────────────────────────────────────────────────────────────────────────
  // Legacy route parsed `filters` (a JSON string) and pulled status/level out of it,
  // then called getPayments. Same behavior, but a malformed/absent `filters` now safely
  // defaults to {} instead of throwing a generic 500.
  async list({ query, skip, limit }) {
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

    const result = await this.legacy.getPayments({
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
    return this.legacy.getListOfPaymentInvoices(Number(paymentId));
  }

  // ── workflow actions (money state changes) ──────────────────────────────────────
  // POST /payments/:paymentId/actions/pay — legacy processPayment. The legacy money
  // guards (date present, amount > 0, amount <= pending, not already fully paid) live in
  // the service and are preserved; we map its known throws to language-neutral codes.
  async pay({ paymentId, body, authUser }) {
    const { amount, issuedDate, file } = body;
    return this.legacy.processPayment(
      Number(paymentId),
      Number(amount),
      new Date(issuedDate),
      file,
      authUser.id,
    );
  }

  // POST /payments/:paymentId/actions/mark-overdue — legacy markPaymentAsOverdue.
  async markOverdue({ paymentId }) {
    return this.legacy.markPaymentAsOverdue(paymentId);
  }

  // POST /payments/:paymentId/actions/change-status — legacy changePaymentLevel. The new
  // level is enum-validated at the route (Zod). The legacy service's third arg (old level)
  // is ignored, so we no longer accept or pass a client-trusted state value.
  async changeStatus({ paymentId, body }) {
    return this.legacy.changePaymentLevel(paymentId, body.newPaymentLevel);
  }
}

export const paymentUsecase = new PaymentUsecase(paymentRepository);
