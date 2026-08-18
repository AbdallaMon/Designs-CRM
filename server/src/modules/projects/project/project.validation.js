// projects/project Zod schemas. Framework-agnostic; `validate(schema, where)` returns
// 422 + details on failure. Legacy accepted loose, untyped query/bodies (e.g. a
// `filters` JSON STRING, arbitrary field/value pairs). We preserve that tolerance:
// query/list schemas `.passthrough()` and coerce only the ids/pagination we actually
// consume, so observable behavior is unchanged while every mutating route still gets a
// schema.
import { z } from "zod";
import { generalMessagesCodes } from "@dms/shared";

const idParam = z.coerce.number().int().positive();

// Optional id that tolerates the empty/null placeholders the legacy FE sends for
// not-yet-chosen ids (e.g. designerId "" on the remove path, a null groupId/assignmentId
// on the add path). Plain `z.coerce.number().int().positive().optional()` would coerce
// "" / null → 0 and reject it as non-positive (only `undefined` skips), whereas master's
// legacy route spread req.body straight in — so these placeholders were harmless. Drop
// them to `undefined` first to preserve that tolerance.
const optionalId = z.preprocess(
  (v) => (v === "" || v === null ? undefined : v),
  z.coerce.number().int().positive().optional(),
);

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
  // PUT /:id — plain field/status edit. Whitelist (mass-assignment fix): only the
  // genuinely client-editable scalar fields reach the usecase/repo; any other key (id,
  // userId, clientLeadId, contractId, startedAt, createdAt/updatedAt, notified*, relations
  // such as assignments/tasks/clientLead/contract/deliverySchedules) is silently STRIPPED
  // by Zod's default `.strip()`. The project-edit form (ProjectDetails.jsx) submits the
  // whole `{...project}` object, exactly as master did — master used a denylist and passed
  // the rest, so it never 422'd; `.strict()` (reject-on-extra-key) broke that observable
  // behavior. Stripping preserves both: the extra keys never touch Prisma, and the edit
  // still succeeds. The whitelist is the union of (a) fields the legacy updateProject left
  // through after its denylist — see services/main/shared/projectServices.js ~408-416 which
  // deletes only id,userId,startedAt,user,clientLeadId,clientLead,assignments,tasks — and
  // (b) the fields the project-edit form sends. `oldStatus` is accepted but server-overridden
  // in the usecase from the scoped row.
  static updateProject = z.object({
    status: z.string().optional(),
    priority: z.string().optional(),
    deliveryTime: z.union([z.string(), z.date()]).nullish(),
    oldStatus: z.string().optional(),
    type: z.string().optional(),
    area: z.union([z.number(), z.string()]).nullish(),
    groupId: z.coerce.number().int().positive().optional(),
    groupTitle: z.string().optional(),
    isModification: z.boolean().optional(),
    endedAt: z.union([z.string(), z.date()]).nullish(),
  }).strip();

  // POST /:id/actions/assign-designer.
  static assignDesigner = z.object({
    designerId: optionalId,
    assignmentId: optionalId,
    deleteDesigner: z.boolean().optional(),
    addToModification: z.boolean().optional(),
    removeFromModification: z.boolean().optional(),
    groupId: optionalId,
  }).passthrough().superRefine((data, ctx) => {
    const requiredField = data.deleteDesigner ? "assignmentId" : "designerId";
    if (!data[requiredField]) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [requiredField],
        message: generalMessagesCodes.VALIDATION_ERROR,
      });
    }
  });

  // POST /designers/:leadId/actions/change-status — the project id travels in the body.
  static changeStatus = z.object({
    id: z.coerce.number().int().positive(),
    status: z.string().optional(),
    oldStatus: z.string().optional(),
  }).passthrough();
}
