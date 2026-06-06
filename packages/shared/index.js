// @dms/shared barrel — framework-agnostic constants, helpers, and message codes.
// MUST NOT import Prisma / Express / Next. SEED for Stage 1; grows as modules
// migrate.
export * from "./auth.js";
export * from "./helpers.js";
export * from "./messages-names.js";
export * from "./messages-codes/index.js";
export * from "./constants/access/permissions.constants.js";
export * from "./constants/access/roles.constants.js";
export * from "./constants/access/role-permissions.js";
