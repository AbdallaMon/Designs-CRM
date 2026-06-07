// users/user Zod schemas. Framework-agnostic; `validate(schema, source)` returns 422 +
// details on failure. Legacy accepted loose, untyped query/bodies (raw `req.body`
// passed straight into Prisma). We preserve that tolerance where legacy did: query/list
// schemas `.passthrough()` and coerce only the ids/pagination we consume. Mutating
// bodies declare the fields the legacy services actually read, and self-profile edit is
// the ONE place we tighten (whitelist) — see PROFILE_SELF_EDITABLE in the usecase: the
// legacy `updateUserProfileById(userId, req.body)` was a blind passthrough (a
// privilege-escalation hole). The route still gates + scope-checks; this schema only
// shapes input.
import { z } from "zod";

const idParam = z.coerce.number().int().positive();

export class UserValidation {
  // ── params ───────────────────────────────────────────────────────────────────
  static userIdParams = z.object({ userId: idParam });

  // ── query (kept permissive; legacy read arbitrary searchParams) ────────────────
  static listQuery = z.object({}).passthrough();

  // ── admin create / edit (legacy createStaffUser / editStaffUser read these) ────
  static createUser = z
    .object({
      email: z.string().min(1),
      password: z.string().min(1),
      name: z.string().min(1),
      role: z.string().min(1),
      telegramUsername: z.string().nullish(),
    })
    .passthrough();

  static updateUser = z
    .object({
      email: z.string().optional(),
      password: z.string().optional(),
      name: z.string().optional(),
      role: z.string().optional(),
      telegramUsername: z.string().nullish(),
    })
    .passthrough();

  // PATCH /:userId — ban/unban (legacy changeUserStatus toggles isActive of body.user).
  static changeStatus = z
    .object({ user: z.object({ isActive: z.boolean() }).passthrough() })
    .passthrough();

  // PATCH /:userId/staff-extra — legacy toggleExtraStaffField wrote req.body verbatim
  // (a privilege-escalation hole: MANAGE_STAFF_EXTRA is granted to isSuperSales, so a
  // non-base-admin could PATCH {password|role|isSuperSales|isActive}). The ONLY fields
  // the FE caller toggles here are the two boolean staff flags (UsersPage.jsx
  // toggleUserStatus → "isPrimary" / "isSuperSales"). Strict-whitelist them; everything
  // else (password/role/isActive/...) is rejected at the route (422).
  static staffExtra = z
    .object({
      isPrimary: z.boolean().optional(),
      isSuperSales: z.boolean().optional(),
    })
    .strict();

  // PUT /:userId/roles — legacy updateUserRoles reads { added, removed }.
  static manageRoles = z
    .object({
      added: z.array(z.string()).default([]),
      removed: z.array(z.string()).default([]),
    })
    .passthrough();

  // GET|PUT /:userId/auto-assignments — legacy updateUserAutoAssignment reads
  // { added, removed }.
  static manageAutoAssignments = z
    .object({
      added: z.array(z.string()).default([]),
      removed: z.array(z.string()).default([]),
    })
    .passthrough();

  // POST /:userId/restricted-countries — legacy reads body.countries (string[]).
  static restrictedCountries = z
    .object({ countries: z.array(z.string()).default([]) })
    .passthrough();

  // PUT /max-leads/:userId — legacy reads body.maxLeadsCounts.
  static maxLeads = z
    .object({ maxLeadsCounts: z.union([z.string(), z.number()]) })
    .passthrough();

  // PUT /max-leads-per-day/:userId — legacy reads body.maxLeadCountPerDay.
  static maxLeadsPerDay = z
    .object({ maxLeadCountPerDay: z.union([z.string(), z.number()]) })
    .passthrough();

  // PUT /:userId/profile — self-service edit. Kept permissive at the Zod layer
  // (legacy accepted any body); the usecase whitelists the safe self-editable fields
  // for non-admin callers (the privilege-escalation fix).
  static updateProfile = z.object({}).passthrough();
}
