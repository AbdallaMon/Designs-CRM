// accounting/payment repository — Prisma I/O ONLY (no business rules, no AppError).
// The heavy financial logic (getPayments / processPayment / markPaymentAsOverdue /
// changePaymentLevel / getListOfPaymentInvoices) lives in the not-yet-migrated
// accountant service and is invoked from the usecase via lazy adapters — the same
// behavior-preserving pattern used by the migrated leads/courses modules. The only
// direct Prisma here is the minimal existence read the workflow-action scope checker
// needs (load a payment's id+status to confirm it exists before a money mutation).
import prisma from "../../../infra/prisma/prisma.js";

class PaymentRepository {
  model = prisma.payment;

  // Server-authoritative current state for the scope/guard checker. Returns null when
  // the payment does not exist (the usecase turns that into 404 PAYMENT_NOT_FOUND).
  findPaymentState({ paymentId }) {
    return prisma.payment.findUnique({
      where: { id: Number(paymentId) },
      select: { id: true, status: true, paymentLevel: true, amount: true, amountPaid: true },
    });
  }
}

export const paymentRepository = new PaymentRepository();
export { PaymentRepository };
