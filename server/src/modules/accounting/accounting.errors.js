// Translates KNOWN raw-Error throws from the frozen legacy accountant service
// (services/main/accountant/accountantServices.js) into language-neutral AppError codes so
// the central error-handler serializes a proper 4xx envelope (instead of an opaque 500) and
// the frontend's accountingMessages map can resolve a real domain message.
//
// WHY this layer exists: the legacy service does `throw new Error("Payment not found")` etc.
// error-handler.js only recognizes AppError → a plain Error becomes HTTP 500 "Internal
// server error", and the FE domain codes (PAYMENT_ALREADY_FULLY_PAID, ...) never resolve.
// We do NOT modify the frozen service — we wrap its calls here and re-map by message.
//
// Matching is by the EXACT legacy string (an `equals` map) plus a few PREFIX matchers for
// the messages that interpolate dynamic values (pending amount / month name). ANYTHING not
// recognized is re-thrown untouched, so genuine/unexpected errors still surface as 500.
import { AppError } from "../../shared/errors/AppError.js";
import { accountingMessagesCodes as C } from "@dms/shared";

// Exact-string → { code, status }. These legacy strings are copied verbatim from the
// accountant service throw sites (including its two spelling typos: "fiels"/"fileds").
const EXACT = {
  "Please fill all data": { code: C.REQUIRED_FIELDS_MISSING, status: 422 },
  "Please enter a date": { code: C.PAYMENT_DATE_REQUIRED, status: 422 },
  "Payment not found": { code: C.PAYMENT_NOT_FOUND, status: 404 },
  "Invalid Payment: The payment has already been fully paid.": {
    code: C.PAYMENT_ALREADY_FULLY_PAID,
    status: 409,
  },
  "Fill all the fields please": { code: C.REQUIRED_FIELDS_MISSING, status: 422 },
  "Rent not found": { code: C.RENT_NOT_FOUND, status: 404 },
  "Please fill all fiels": { code: C.REQUIRED_FIELDS_MISSING, status: 422 }, // legacy typo
  "Fill all the fileds please": { code: C.REQUIRED_FIELDS_MISSING, status: 422 }, // legacy typo
};

// Prefix/contains matchers for the legacy messages that interpolate runtime values.
const DYNAMIC = [
  // `Invalid Payment: The pending amount is ${pendingAmount}. The amount provided ...`
  {
    test: (m) => m.startsWith("Invalid Payment: The pending amount is"),
    code: C.PAYMENT_AMOUNT_EXCEEDS_PENDING,
    status: 400,
  },
  // `Invalid Payment: The payment amount must be greater than zero. You provided ...`
  {
    test: (m) => m.startsWith("Invalid Payment: The payment amount must be greater than zero"),
    code: C.PAYMENT_AMOUNT_INVALID,
    status: 400,
  },
  // `Monthly salary for ${Month Year} already exists for this user`
  {
    test: (m) => m.startsWith("Monthly salary for") && m.endsWith("already exists for this user"),
    code: C.MONTHLY_SALARY_ALREADY_EXISTS,
    status: 409,
  },
];

/**
 * Map a raw legacy Error message to an AppError, or return null if it is unrecognized.
 * @param {unknown} err
 * @returns {AppError|null}
 */
function mapLegacyError(err) {
  // Never re-map something that is already an AppError (or not an Error with a message).
  if (err instanceof AppError) return null;
  const message = err && typeof err.message === "string" ? err.message : null;
  if (!message) return null;

  const exact = EXACT[message];
  if (exact) return new AppError(exact.code, exact.status);

  for (const rule of DYNAMIC) {
    if (rule.test(message)) return new AppError(rule.code, rule.status);
  }
  return null;
}

/**
 * Run a legacy service call; translate KNOWN domain throws to AppError codes, and re-throw
 * anything unrecognized as-is (so unexpected errors still 500). Happy path is untouched.
 * @template T
 * @param {() => Promise<T>} fn
 * @returns {Promise<T>}
 */
export async function translateLegacyAccountingError(fn) {
  try {
    return await fn();
  } catch (err) {
    const mapped = mapLegacyError(err);
    if (mapped) throw mapped;
    throw err;
  }
}

// Exported for unit tests.
export { mapLegacyError };
