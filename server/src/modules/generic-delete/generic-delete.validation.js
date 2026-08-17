import { validationMessagesCodes as V } from "@dms/shared";
import { z } from "zod";
import { DELETABLE_MODELS } from "./generic-delete.config.js";

// The compatibility delete endpoint is constrained to sub-resource models used by
// DeleteModelButton. It cannot target standalone sensitive models such as User,
// ClientLead, or Payment.
export { DELETABLE_MODELS } from "./generic-delete.config.js";

class GenericDeleteSchemas {
  idParam = z.object({
    id: z.coerce.number().int().positive(),
  });

  // Only `model` is accepted. Models that need dependent cleanup use server-decided
  // teardown logic; clients cannot submit arbitrary cascade specifications.
  remove = z.object({
    model: z.string().refine((m) => DELETABLE_MODELS.includes(m), {
        message: V.MODEL_NOT_DELETABLE,
    }),
  });
}

export const genericDeleteSchemas = new GenericDeleteSchemas();
