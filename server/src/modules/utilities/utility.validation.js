// utilities Zod schemas. `validate(schema, source)` returns 422 + details on failure.
// Mutating bodies use `.strict()` (mass-assignment defense).
//
// SECURITY (FIX 1 — user-log IDOR): the user-log schemas DO NOT accept a `userId` target.
// The subject is ALWAYS the authenticated caller (derived from req.auth.id in the usecase,
// like the notification self-scope fix). `submitUserLog` is `.strict()` so a smuggled
// `userId` in the body is REJECTED (422); `userLogQuery` is `.strict()` so a `userId` in
// the query is rejected too. A caller can only ever submit/read THEIR OWN log.
//
// SECURITY (FIX 2 — generic model read passthrough): `modelQuery` is now `.strict()` and
// accepts ONLY `model`. The legacy `select`/`include`/`where` query keys (which the legacy
// builder spread straight into Prisma, enabling relation traversal / arbitrary column
// reads) are NO LONGER accepted — these reads serve fixed pick-list projections defined
// server-side. The ALLOW-LIST + projection enforcement lives in the usecase/repo so it can
// return the dedicated language-neutral code (the hardening).
import { z } from "zod";

const idParam = z.coerce.number().int().positive();

export class UtilityValidation {
  // ── params ───────────────────────────────────────────────────────────────────────
  static userIdParams = z.object({ userId: idParam });

  // ── user logs (self-scoped — NO target userId) ─────────────────────────────────────
  static userLogQuery = z
    .object({
      startTime: z.string().min(1),
      endTime: z.string().min(1),
    })
    .strict();

  static submitUserLog = z
    .object({
      date: z.string().min(1),
      description: z.string().trim().min(1),
      totalMinutes: z.coerce.number().int().nonnegative().optional(),
    })
    .strict();

  // ── images ───────────────────────────────────────────────────────────────────────
  static imagesQuery = z.object({
    patternIds: z.string().optional(),
    spaceIds: z.string().optional(),
  });

  // ── generic model reads (allow-list + fixed projection enforced in the usecase/repo) ─
  // `.strict()`: ONLY `model` is accepted; client select/include/where are dropped.
  static modelQuery = z.object({ model: z.string().trim().min(1) }).strict();
}
