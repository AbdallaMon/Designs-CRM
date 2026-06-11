// English mirror of the CLIENT-PORTAL message CODES (namespace "clientPortalMessages").
// CODE → English. Mirrors keys 1:1 with ../clientPortal.js (the Arabic map). Bilingual Phase 1.

export const clientPortalMessagesEn = {
  // ── payments (client Stripe checkout) ──────────────────────────────────────────
  PAYMENT_CHECKOUT_CREATED: "Checkout session created",
  PAYMENT_VERIFIED: "Payment confirmed successfully",
  PAYMENT_NOT_COMPLETED: "The payment is not complete yet",
  PAYMENT_BACKFILL_DONE: "Payment data updated",
  PAYMENT_CHECKOUT_FAILED: "Couldn't create the checkout session, please try again",
  PAYMENT_VERIFY_FAILED: "Couldn't verify the payment, please try again",
  PAYMENT_LEAD_NOT_FOUND: "Payment data not found",
  PAYMENT_NOT_ALLOWED: "This payment can't be processed",

  // ── uploads (client file upload) ───────────────────────────────────────────────
  UPLOAD_FAILED: "Couldn't upload the file, please try again",

  // ── notes (client note on a lead) ──────────────────────────────────────────────
  NOTES_FETCHED: "Notes retrieved",
  NOTE_CREATED: "Note added successfully",
  NOTE_TARGET_INVALID: "Invalid note target",
  NOTE_CONTENT_TOO_LONG: "The note content is too long",

  // ── languages (public lookup) ──────────────────────────────────────────────────
  LANGUAGES_FETCHED: "Languages retrieved",
};
