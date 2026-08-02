// Task request schemas. IDs are coerced and every mutating route is validated.
import { z } from "zod";

const idParam = z.coerce.number().int().positive();

export class TaskValidation {
  // ── params ───────────────────────────────────────────────────────────────────
  static idParams = z.object({ id: idParam });
  static taskIdParams = z.object({ taskId: idParam });

  // ── bodies ─────────────────────────────────────────────────────────────────────
  static createTask = z.object({
    title: z.string().min(1),
    description: z.string().nullish(),
    type: z.string().optional(),
    status: z.string().optional(),
    priority: z.string().optional(),
    dueDate: z.union([z.string(), z.date()]).nullish(),
    projectId: z.coerce.number().int().positive().nullish(),
    userId: z.coerce.number().int().positive().nullish(),
    clientLeadId: z.coerce.number().int().positive().nullish(),
  }).passthrough();

  // PUT /:taskId accepts only user-editable fields. Relationship and system-managed
  // fields cannot be assigned from the client; finishedAt is derived server-side.
  static updateTask = z.object({
    title: z.string().optional(),
    description: z.string().nullish(),
    status: z.string().optional(),
    priority: z.string().optional(),
    dueDate: z.union([z.string(), z.date()]).nullish(),
  }).strict();

  // POST /notes — generic note add.
  static addNote = z.object({
    content: z.string().optional(),
    attachment: z.string().nullish(),
    idKey: z.string().optional(),
    id: z.coerce.number().int().positive().optional(),
  }).passthrough();

  // DELETE /:id is task-only. No additional keys or client-defined cascades are accepted.
  static remove = z.object({
    model: z.literal("Task"),
  }).strict();
}
