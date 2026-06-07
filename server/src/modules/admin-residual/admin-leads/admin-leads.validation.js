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
      emirate: z.string().optional(),
      location: z.string().optional(),
      country: z.string().optional(),
      clientDescription: z.string().optional(),
      timeToContact: z.string().optional(),
      priceOption: z.string().optional(),
      priceRange: z.array(z.number()).optional(),
      url: z.any().optional(),
      notClientPage: z.boolean().optional(),
      lng: z.string().optional(),
    })
    .passthrough();
}
