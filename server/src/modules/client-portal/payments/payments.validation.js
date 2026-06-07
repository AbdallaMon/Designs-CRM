// client-portal/payments validation — the PUBLIC client Stripe checkout flow.
//
// NOTE ON AMOUNTS: the legacy `/pay` checkout hardcodes `unit_amount: 0` (a $0 "book now"
// placeholder — the real fee is deducted at contract time). There is NO client-supplied
// amount anywhere in this flow, so there is no amount to tamper with. The validators below
// still coerce/constrain ids and the optional `lng` to be safe.
import { z } from "zod";

const id = z.coerce.number().int().positive();

export const PaymentsValidation = {
  // POST /pay — create a Stripe checkout for a lead. clientLeadId is required (the email +
  // metadata are derived from it server-side); clientId/lng are passed through as metadata.
  pay: z
    .object({
      clientLeadId: id,
      clientId: id.optional(),
      lng: z.string().trim().optional(),
    })
    .strict(),

  // GET /payment-status?sessionId=...&clientLeadId=...&lng=... — verify a checkout. The
  // sessionId is the Stripe payment proof; clientLeadId is cross-checked against the verified
  // session metadata in the usecase (IDOR close — see usecase).
  statusQuery: z
    .object({
      sessionId: z.string().trim().min(1),
      clientLeadId: id,
      lng: z.string().trim().optional(),
    })
    .strip(),

  // GET /stripe/backfill?pass=... — admin/secret-gated maintenance (the body is unused; the
  // legacy handler early-returns null, so this is effectively a no-op preserved verbatim).
  backfillQuery: z
    .object({
      pass: z.string().optional(),
    })
    .strip(),
};
