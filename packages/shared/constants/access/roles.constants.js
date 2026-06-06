// UserRole values — mirrored verbatim from the FROZEN Prisma enum `UserRole`
// (packages/db/prisma/schema.prisma). `@dms/shared` is framework-agnostic and
// must not import the Prisma client, so the enum values are duplicated here as
// plain string constants. KEEP IN SYNC with the schema enum (the schema is the
// source of truth for the DB; this is the source of truth for code/permissions).
//
// `subRoles` (UserSubRole[]) entries are themselves `UserRole` values, so the
// same constant covers base role AND sub-roles.
export const USER_ROLES = {
  ADMIN: "ADMIN",
  STAFF: "STAFF",
  THREE_D_DESIGNER: "THREE_D_DESIGNER",
  TWO_D_DESIGNER: "TWO_D_DESIGNER",
  TWO_D_EXECUTOR: "TWO_D_EXECUTOR",
  ACCOUNTANT: "ACCOUNTANT",
  SUPER_ADMIN: "SUPER_ADMIN",
  SUPER_SALES: "SUPER_SALES",
  CONTACT_INITIATOR: "CONTACT_INITIATOR",
};

/** Every UserRole value (base + possible sub-role) as a flat list. */
export const ALL_USER_ROLES = Object.freeze(Object.values(USER_ROLES));
