// client-portal module message CODES — the PUBLIC/token client-facing standalone surfaces
// (payments, uploads, notes, languages) that the legacy `routes/client/*` sub-routers
// served. SCREAMING_SNAKE_CASE, key === value (the string IS the code). Carried in the API
// envelope `message` field; the client resolves (translationKey: clientPortalMessages, code)
// → displayed string. Language-neutral — never put Arabic/English prose here. These REPLACE
// the legacy Arabic/English prose responses ("Payment verified", "Note created successfully",
// "Some thing wrong happen try again later", etc.).
export const clientPortalMessagesCodes = {
  // ── payments (client Stripe checkout) ──────────────────────────────────────────
  PAYMENT_CHECKOUT_CREATED: "PAYMENT_CHECKOUT_CREATED",
  PAYMENT_VERIFIED: "PAYMENT_VERIFIED",
  PAYMENT_NOT_COMPLETED: "PAYMENT_NOT_COMPLETED",
  PAYMENT_BACKFILL_DONE: "PAYMENT_BACKFILL_DONE",
  PAYMENT_CHECKOUT_FAILED: "PAYMENT_CHECKOUT_FAILED",
  PAYMENT_VERIFY_FAILED: "PAYMENT_VERIFY_FAILED",
  PAYMENT_LEAD_NOT_FOUND: "PAYMENT_LEAD_NOT_FOUND",
  PAYMENT_NOT_ALLOWED: "PAYMENT_NOT_ALLOWED",

  // ── uploads (client file upload — frozen chunk/http handlers) ──────────────────
  UPLOAD_FAILED: "UPLOAD_FAILED",

  // ── notes (client note on a lead) ──────────────────────────────────────────────
  NOTES_FETCHED: "NOTES_FETCHED",
  NOTE_CREATED: "NOTE_CREATED",
  NOTE_TARGET_INVALID: "NOTE_TARGET_INVALID", // idKey not in the client allow-list
  NOTE_CONTENT_TOO_LONG: "NOTE_CONTENT_TOO_LONG",

  // ── languages (public lookup) ──────────────────────────────────────────────────
  LANGUAGES_FETCHED: "LANGUAGES_FETCHED",
};
