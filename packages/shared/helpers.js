// Pure, framework-agnostic cross-cutting helpers.
//
// RULES (mirrored from the reference):
//   - @dms/shared must NOT import Prisma / Express / Next. Helpers that need DB
//     access take `prisma` as a parameter; they never import the client.
//   - This file is the home for domain predicates and capability computations;
//     module migrations append theirs here.

import { ROLE_PERMISSIONS, SUPER_SALES_EXTRA_PERMISSIONS } from "./constants/access/role-permissions.js";
import { splitPermissionCode } from "./constants/access/permissions.constants.js";

/**
 * True when `user.role` is one of the given roles.
 * NOTE: role is descriptive only — authorization is by permission code + scope,
 * never by role alone. Use this for display/labeling helpers, not gating.
 */
export function checkIfUserIs(user, roles = []) {
  if (!user) return false;
  return roles.some((role) => user.role === role);
}

/**
 * Resolve the codes a single role grants (returns [] for an unknown role).
 * @param {string} role  a UserRole value
 * @returns {string[]}
 */
export function getPermissionsForRole(role) {
  return ROLE_PERMISSIONS[role] ?? [];
}

/**
 * Compute a user's EFFECTIVE permissions from the code-defined role map.
 *
 * Effective = base role codes
 *           ∪ each sub-role's role codes (user.subRoles[])
 *           ∪ isSuperSales extra codes (if user.isSuperSales).
 *
 * Pure & unit-testable: no DB, no side effects. Tolerant of both shapes of
 * `subRoles`:
 *   - Prisma rows:        [{ subRole: "ACCOUNTANT" }, ...]
 *   - plain string array: ["ACCOUNTANT", ...]
 *
 * @param {object|null|undefined} user
 * @param {string} [user.role]
 * @param {boolean} [user.isSuperSales]
 * @param {Array<string|{subRole:string}>} [user.subRoles]
 * @returns {{ permissions: string[], permissionsByModule: Record<string, string[]> }}
 */
export function getEffectivePermissions(user) {
  if (!user) {
    return { permissions: [], permissionsByModule: {} };
  }

  const set = new Set();

  // base role
  for (const code of getPermissionsForRole(user.role)) set.add(code);

  // sub-roles (each is itself a UserRole)
  const subRoles = Array.isArray(user.subRoles) ? user.subRoles : [];
  for (const entry of subRoles) {
    const subRole = typeof entry === "string" ? entry : entry?.subRole;
    if (!subRole) continue;
    for (const code of getPermissionsForRole(subRole)) set.add(code);
  }

  // isSuperSales augmentation
  if (user.isSuperSales) {
    for (const code of SUPER_SALES_EXTRA_PERMISSIONS) set.add(code);
  }

  const permissions = Array.from(set);

  // group by module for nav/visibility lookups on the client
  const permissionsByModule = {};
  for (const code of permissions) {
    const { module } = splitPermissionCode(code);
    (permissionsByModule[module] ??= []).push(code);
  }

  return { permissions, permissionsByModule };
}

/**
 * True when the given effective-permission list contains the code.
 * @param {string[]} permissions
 * @param {string} code
 */
export function hasPermission(permissions, code) {
  return Array.isArray(permissions) && permissions.includes(code);
}

/** True when ALL of `codes` are present. */
export function hasAllPermissions(permissions, codes = []) {
  return codes.every((c) => hasPermission(permissions, c));
}

/** True when ANY of `codes` is present. */
export function hasAnyPermission(permissions, codes = []) {
  return codes.some((c) => hasPermission(permissions, c));
}

/**
 * Per-record capabilities pattern — DTOs use this to attach a
 * `capabilities.{ canX, canY, ... }` object to every scoped list/detail item, so
 * the FE can show/hide actions WITHOUT re-implementing the rules. The backend
 * remains the source of truth; capabilities are a rendering hint.
 *
 * Each rule is `(ctx) => boolean`, evaluated against a context the caller builds
 * (effective permissions + the record + the auth user). Rules should combine a
 * permission CODE with object-scope facts (ownership/membership/status), mirroring
 * the server-side checker.
 *
 * @param {Record<string, (ctx: object) => boolean>} rules
 * @param {object} ctx  e.g. { permissions, record, authUserId }
 * @returns {Record<string, boolean>}
 *
 * @example
 *   const capabilities = computeCapabilities(
 *     {
 *       canEdit: ({ permissions, record, authUserId }) =>
 *         hasPermission(permissions, PERMISSIONS.CHAT.ROOM_EDIT) &&
 *         record.createdById === authUserId,
 *       canDelete: ({ permissions, record, authUserId }) =>
 *         hasPermission(permissions, PERMISSIONS.CHAT.ROOM_DELETE) &&
 *         record.createdById === authUserId,
 *     },
 *     { permissions, record: room, authUserId },
 *   );
 */
export function computeCapabilities(rules, ctx) {
  const out = {};
  for (const [name, rule] of Object.entries(rules || {})) {
    try {
      out[name] = Boolean(rule(ctx));
    } catch {
      out[name] = false;
    }
  }
  return out;
}
