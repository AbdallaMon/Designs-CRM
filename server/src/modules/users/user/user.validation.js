// User request schemas. Mutating identity requests are strict; permission profiles are
// managed only through the dedicated profile-assignment endpoint.
import { z } from "zod";

const idParam = z.coerce.number().int().positive();

export class UserValidation {
  // ── params ───────────────────────────────────────────────────────────────────
  static userIdParams = z.object({ userId: idParam });

  // ── query ─────────────────────────────────────────────────────────────────────
  static listQuery = z.object({}).passthrough();

  // ── admin identity create / edit ───────────────────────────────────────────────
  static createUser = z
    .object({
      email: z.string().min(1),
      password: z.string().min(1),
      name: z.string().min(1),
      telegramUsername: z.string().nullish(),
    })
    .strict();

  static updateUser = z
    .object({
      email: z.string().optional(),
      password: z.string().optional(),
      name: z.string().optional(),
      telegramUsername: z.string().nullish(),
    })
    .strict();

  // PATCH /:userId — activate/deactivate.
  static changeStatus = z
    .object({ user: z.object({ isActive: z.boolean() }).passthrough() })
    .passthrough();

  // GET|PUT /:userId/auto-assignments.
  static manageAutoAssignments = z
    .object({
      added: z.array(z.string()).default([]),
      removed: z.array(z.string()).default([]),
    })
    .passthrough();

  // POST /:userId/restricted-countries.
  static restrictedCountries = z
    .object({ countries: z.array(z.string()).default([]) })
    .passthrough();

  // PUT /max-leads/:userId.
  static maxLeads = z
    .object({ maxLeadsCounts: z.union([z.string(), z.number()]) })
    .passthrough();

  // PUT /max-leads-per-day/:userId.
  static maxLeadsPerDay = z
    .object({ maxLeadCountPerDay: z.union([z.string(), z.number()]) })
    .passthrough();

  // PUT /:userId/profile. The usecase applies the self/admin field allow-list.
  static updateProfile = z.object({}).passthrough();

  // PUT /:userId/profiles — admin assigns the user's permission profiles + which is
  // current. At least one profile is required (a user must always hold ≥1). The
  // usecase validates the ids exist and that currentProfileId is among them.
  static updateUserProfiles = z.object({
    profileIds: z.array(z.coerce.number().int().positive()).min(1),
    currentProfileId: z.coerce.number().int().positive().optional(),
  });
}
