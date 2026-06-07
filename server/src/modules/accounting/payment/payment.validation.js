// accounting/payment Zod schemas. Money-sensitive — amounts are coerced to NUMBERS
// and constrained POSITIVE (no NaN, no <= 0) at the edge, in addition to the legacy
// service-side checks (which are preserved). `validate(schema, where)` returns 422 +
// details on failure. List/query schemas stay permissive (legacy read a `filters` JSON
// STRING + arbitrary searchParams) so observable behavior is unchanged.
import { z } from "zod";

const idParam = z.coerce.number().int().positive();

// A strictly-positive money amount: coerce string|number → number, reject NaN / <= 0.
const positiveAmount = z.coerce.number().refine((n) => Number.isFinite(n) && n > 0, {
  message: "amount must be a positive number",
});

// Mirrors the frozen PaymentLevel enum (schema.prisma). Hardens the legacy
// `changePaymentLevel` which trusted an arbitrary client-supplied string.
const PAYMENT_LEVELS = [
  "LEVEL_1",
  "LEVEL_2",
  "LEVEL_3",
  "LEVEL_4",
  "LEVEL_5",
  "LEVEL_6",
  "LEVEL_7_OR_MORE",
];

export class PaymentValidation {
  // ── params ───────────────────────────────────────────────────────────────────
  static paymentIdParams = z.object({ paymentId: idParam });

  // ── query (kept permissive; legacy read arbitrary searchParams incl. `filters` JSON) ──
  static listQuery = z.object({}).passthrough();

  // ── bodies ─────────────────────────────────────────────────────────────────────
  // POST /payments/:paymentId/actions/pay — legacy processPayment(+amount, new Date(issuedDate), file, userId)
  static pay = z
    .object({
      amount: positiveAmount,
      issuedDate: z.union([z.string().min(1), z.date()]),
      file: z.string().nullish(),
    })
    .strict();

  // POST /payments/:paymentId/actions/change-status — legacy changePaymentLevel(newPaymentLevel)
  // (the legacy service ignores the old level; not accepted so the API doesn't imply a
  // client-trusted state value).
  static changeStatus = z
    .object({
      newPaymentLevel: z.enum(PAYMENT_LEVELS),
    })
    .strict();
}
