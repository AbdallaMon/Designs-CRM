// accounting/payment Zod schemas. Money-sensitive — amounts are coerced to NUMBERS
// and constrained POSITIVE (no NaN, no <= 0) at the edge, in addition to the legacy
// service-side checks (which are preserved). `validate(schema, where)` returns 422 +
// details on failure. List/query schemas stay permissive (legacy read a `filters` JSON
// STRING + arbitrary searchParams) so observable behavior is unchanged.
import { z } from "zod";
import { CONTRACT_LEVELS, generalMessagesCodes, validationMessagesCodes as V } from "@dms/shared";

const idParam = z.coerce.number().int().positive();

// A strictly-positive money amount: coerce string|number → number, reject NaN / <= 0.
const positiveAmount = z.coerce.number().refine((n) => Number.isFinite(n) && n > 0, {
  message: V.POSITIVE_NUMBER_REQUIRED,
});

function isRealDate(value) {
  if (value instanceof Date) return !Number.isNaN(value.getTime());
  if (typeof value !== "string" || Number.isNaN(new Date(value).getTime())) return false;

  const calendarDate = /^(\d{4})-(\d{2})-(\d{2})(?:$|T)/.exec(value);
  if (!calendarDate) return true;

  const [, yearText, monthText, dayText] = calendarDate;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return month >= 1 && month <= 12 && day >= 1 && day <= daysInMonth;
}

const issuedDate = z.any().refine(
  (value) => (typeof value === "string" || value instanceof Date) && isRealDate(value),
  { message: generalMessagesCodes.VALIDATION_ERROR },
);

// Mirrors the frozen PaymentLevel enum (schema.prisma). Hardens the legacy
// `changePaymentLevel` which trusted an arbitrary client-supplied string.
const PAYMENT_LEVELS = [
  CONTRACT_LEVELS.LEVEL_1,
  CONTRACT_LEVELS.LEVEL_2,
  CONTRACT_LEVELS.LEVEL_3,
  CONTRACT_LEVELS.LEVEL_4,
  CONTRACT_LEVELS.LEVEL_5,
  CONTRACT_LEVELS.LEVEL_6,
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
      issuedDate,
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
