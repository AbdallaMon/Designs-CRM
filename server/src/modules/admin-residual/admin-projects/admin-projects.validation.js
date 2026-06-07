import { z } from "zod";

// admin-residual/admin-projects validation. The list query is a passthrough of the FE's
// filter/pagination params (the frozen aggregator reads `filters` (JSON string), `id`,
// `page`, `limit`); we keep it permissive (`.passthrough()`) since the frozen fn reads its
// own keys, but the usecase guards the JSON.parse. The create-group body is `.strict()`.
export class AdminProjectsValidation {
  static listQuery = z.object({}).passthrough();

  static createGroupBody = z
    .object({
      clientLeadId: z.coerce.number().int().positive(),
      title: z.string().trim().min(1),
    })
    .strict();
}
