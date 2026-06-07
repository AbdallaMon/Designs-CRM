// leads/client/public-lead validation — the PUBLIC website lead-funnel bodies.
//
// Legacy `routes/client/leads.js` read an UNVALIDATED `req.body` and spread arbitrary keys
// into a `prisma.clientLead.create({ data })`. The data shape was built field-by-field from
// a KNOWN set of keys (category/item/emirate/priceRange/priceOption/...), so we type those
// known keys and DROP everything else (`.strict()` would 422 the rich website form, which
// historically sent extra keys; instead we whitelist-by-omission — Zod strips unknown keys,
// and the usecase only ever reads the known fields, so no client value can reach an
// unintended column → mass-assignment closed without changing the funnel's observable
// behavior for legitimate submissions).
//
// `lng` is preserved ONLY so the usecase can branch the (now CODE-based) response exactly as
// legacy did for the duplicate-today / completed guards; no prose is emitted.
import { z } from "zod";

const trimmed = z.string().trim();

// A finite, non-negative number (price-range tuple bounds).
const money = z.coerce.number().finite().nonnegative();

// Known funnel keys. Unknown keys are stripped (default Zod strip), not rejected, to keep the
// rich website form working unchanged.
const baseLeadFields = {
  lng: trimmed.optional(),
  name: trimmed.min(1).optional(),
  phone: trimmed.min(1).optional(),
  email: z.string().trim().email().optional(),
  category: trimmed.optional(),
  item: trimmed.optional(),
  emirate: trimmed.optional(),
  location: trimmed.optional(),
  country: trimmed.optional(),
  clientDescription: trimmed.optional(),
  stateOfTheProject: trimmed.optional(),
  discoverySource: trimmed.optional(),
  timeToContact: trimmed.optional(),
  priceOption: trimmed.optional(),
  priceRange: z.array(money).length(2).optional(),
  url: trimmed.optional(),
  notClientPage: z.boolean().optional(),
};

export const PublicLeadValidation = {
  // POST /new-lead — name/phone/email required to create or match the Client.
  newLead: z
    .object({
      ...baseLeadFields,
      name: trimmed.min(1),
      phone: trimmed.min(1),
      email: z.string().trim().email(),
    })
    .strip(),

  // POST /new-lead/register — same client-identity requirement, minimal lead.
  registerLead: z
    .object({
      lng: trimmed.optional(),
      name: trimmed.min(1),
      phone: trimmed.min(1),
      email: z.string().trim().email(),
      stateOfTheProject: trimmed.optional(),
    })
    .strip(),

  // POST /new-lead/complete-register/:leadId — completes a draft; body is the rich form.
  completeRegister: z.object(baseLeadFields).strip(),

  // POST /cooperation-requests — partner/cooperation contact form (email only).
  cooperationRequest: z
    .object({
      lng: trimmed.optional(),
      name: trimmed.optional(),
      email: z.string().trim().email().optional(),
      phone: trimmed.optional(),
      website: trimmed.optional(),
    })
    .strip(),

  // :leadId path param — the draft lead id (authoritative over any body value).
  leadIdParams: z.object({
    leadId: z.coerce.number().int().positive(),
  }),
};
