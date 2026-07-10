import { z } from "zod";

// admin-residual/admin-leads validation. The lead/client field updates are DYNAMIC
// single-field edits (`{ field, inputType, [field]: value }`) — exactly the shape the
// leads-module `fieldUpdate` schema validates — so they require `field` and `.passthrough()`
// the dynamic value (a `.strict()` here would break the dynamic-field contract). The
// new-lead body is a rich client form whose known keys are typed and the rest passed
// through to the frozen create logic. Params/ids coerced.
export class AdminLeadsValidation {
  static idParam = z
    .object({
      id: z.coerce.number().int().positive(),
    })
    .strip();

  static leadIdParam = z
    .object({
      leadId: z.coerce.number().int().positive(),
    })
    .strip();

  static clientIdParam = z
    .object({
      clientId: z.coerce.number().int().positive(),
    })
    .strip();

  // dynamic single-field update (mirror of the leads-module fieldUpdate)
  static fieldUpdate = z
    .object({
      field: z.string().min(1),
      inputType: z.string().optional(),
    })
    .passthrough();

  // admin create-new-lead — rich client form; known keys typed, rest passed through to the
  // frozen create logic. Required: email/name/phone + category/item (the create path reads
  // them unconditionally).
  static createNewLead = z
    .object({
      email: z.string().trim().min(1),
      name: z.string().trim().min(1),
      phone: z.string().trim().min(1),
      category: z.string().trim().min(1),
      item: z.string().trim().min(1),
      // .nullish() (not .optional()): the rich client form sends unset fields as `null`,
      // and master's legacy route spread req.body straight into the frozen create logic,
      // so nulls were accepted. .optional() alone rejects null → 422 on new-lead create.
      emirate: z.string().nullish(),
      location: z.string().nullish(),
      country: z.string().nullish(),
      clientDescription: z.string().nullish(),
      timeToContact: z.string().nullish(),
      priceOption: z.string().nullish(),
      priceRange: z.array(z.number()).nullish(),
      url: z.any().optional(),
      notClientPage: z.boolean().nullish(),
      lng: z.string().nullish(),
    })
    .passthrough();
}
