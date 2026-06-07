// projects/project Zod schemas. Framework-agnostic; `validate(schema, where)` returns
// 422 + details on failure. Legacy accepted loose, untyped query/bodies (e.g. a
// `filters` JSON STRING, arbitrary field/value pairs). We preserve that tolerance:
// query/list schemas `.passthrough()` and coerce only the ids/pagination we actually
// consume, so observable behavior is unchanged while every mutating route still gets a
// schema.
import { z } from "zod";

const idParam = z.coerce.number().int().positive();

export class ProjectValidation {
  // ── params ───────────────────────────────────────────────────────────────────
  static idParams = z.object({ id: idParam });
  static leadIdParams = z.object({ leadId: idParam });
  static userIdParams = z.object({ userId: idParam });

  // ── query ────────────────────────────────────────────────────────────────────
  // GET / — projects by clientLead. Coerce clientLeadId to an optional positive int
  // (consistent with the param routes); pass through the other loose legacy query keys.
  static listQuery = z.object({
    clientLeadId: z.coerce.number().int().positive().optional(),
  }).passthrough();

  // ── bodies ─────────────────────────────────────────────────────────────────────
  // PUT /:id — plain field/status edit. STRICT whitelist (mass-assignment fix): only the
  // genuinely client-editable scalar fields are accepted; any other key (id, userId,
  // clientLeadId, contractId, startedAt, createdAt/updatedAt, notified*, relations such as
  // assignments/tasks/clientLead/contract/deliverySchedules) is rejected with 422. The
  // whitelist is the union of (a) fields the legacy updateProject left through after its
  // denylist — see services/main/shared/projectServices.js ~408-416 which deletes only
  // id,userId,startedAt,user,clientLeadId,clientLead,assignments,tasks — and (b) the
  // fields the project-edit form sends. `oldStatus` is accepted but server-overridden in
  // the usecase from the scoped row.
  static updateProject = z.object({
    status: z.string().optional(),
    priority: z.string().optional(),
    deliveryTime: z.union([z.string(), z.date()]).nullish(),
    oldStatus: z.string().optional(),
    type: z.string().optional(),
    role: z.string().optional(),
    area: z.union([z.number(), z.string()]).nullish(),
    groupId: z.coerce.number().int().positive().optional(),
    groupTitle: z.string().optional(),
    isModification: z.boolean().optional(),
    endedAt: z.union([z.string(), z.date()]).nullish(),
  }).strict();

  // POST /:id/actions/assign-designer.
  static assignDesigner = z.object({
    designerId: z.coerce.number().int().positive().optional(),
    assignmentId: z.coerce.number().int().positive().optional(),
    deleteDesigner: z.boolean().optional(),
    addToModification: z.boolean().optional(),
    removeFromModification: z.boolean().optional(),
    groupId: z.coerce.number().int().positive().optional(),
  }).passthrough();

  // POST /designers/:leadId/actions/change-status — the project id travels in the body.
  static changeStatus = z.object({
    id: z.coerce.number().int().positive(),
    status: z.string().optional(),
    oldStatus: z.string().optional(),
  }).passthrough();
}
