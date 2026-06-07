// projects/update Zod schemas. Loose like legacy; coerce only the ids we consume.
import { z } from "zod";

const idParam = z.coerce.number().int().positive();

export class UpdateValidation {
  // ── params ───────────────────────────────────────────────────────────────────
  static clientLeadIdParams = z.object({ clientLeadId: idParam });
  static updateIdParams = z.object({ updateId: idParam });
  static sharedUpdateIdParams = z.object({ sharedUpdateId: idParam });

  // ── bodies ─────────────────────────────────────────────────────────────────────
  static createUpdate = z.object({
    title: z.string().min(1),
    description: z.string().nullish(),
    sharedDepartments: z.array(z.string()).optional(),
  }).passthrough();

  static authorize = z.object({ type: z.string().min(1) }).passthrough();
  static archive = z.object({ isArchived: z.boolean() }).passthrough();
  static markDone = z.object({
    isArchived: z.boolean().optional(),
    clientLeadId: z.coerce.number().int().positive().optional(),
  }).passthrough();
}
