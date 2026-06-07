// projects/task Zod schemas. Loose like legacy (arbitrary task fields); coerce only the
// ids we consume. Every mutating route still gets a schema.
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

  // PUT /:taskId — STRICT whitelist (mass-assignment fix). Legacy updateTask passed the
  // whole body straight into prisma.task.update with NO denylist, so any client could set
  // arbitrary Task columns (projectId, userId, clientLeadId, createdById, finishedAt, ...).
  // We accept only the genuinely user-editable fields the task-edit/board UI sends
  // (status, priority via TaskActions; title/description/dueDate via the edit form). Any
  // other key is rejected with 422. status==="DONE" → finishedAt is set server-side in the
  // legacy updateTask; we never accept it from the client.
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

  // DELETE /:id — TASK delete only. This is the tasks surface, so the legacy generic
  // deleteAModel (which deletes ANY Prisma model named in body.model, and cascade-deletes
  // client-supplied deleteModelesBeforeMain) is constrained to Task: `model` MUST be the
  // literal "Task" (anything else → 422) and NO passthrough keys are accepted, so the
  // client can no longer smuggle a different model or a deleteModelesBeforeMain cascade.
  static remove = z.object({
    model: z.literal("Task"),
  }).strict();
}
