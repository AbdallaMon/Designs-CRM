// Pure, framework-agnostic cross-cutting helpers.
//
// RULES (mirrored from the reference):
//   - @dms/shared must NOT import Prisma / Express / Next. Helpers that need DB
//     access take `prisma` as a parameter; they never import the client.
//   - This file is the home for domain predicates and capability computations;
//     module migrations append theirs here.

import { ROLE_PERMISSIONS } from "./constants/access/role-permissions.js";
import { splitPermissionCode } from "./constants/access/permissions.constants.js";
import { NAVIGATION, NAVIGATION_PERMISSION_ACTIONS } from "./constants/access/navigation.js";
import { PROFILES, resolveProfileKey } from "./constants/access/profiles.js";

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
 * Compute a user's EFFECTIVE permissions, resolved via their PROFILE.
 *
 * Effective = the resolved profile's codes (see `resolveProfileKey`/`PROFILES`).
 * Profiles are the SOLE source; the legacy subRole/isSuperSales unions were removed
 * (they never fired on the main request path — requireAuth resolves from the profile
 * cache — and isSuperSales is not carried in the token).
 *
 * Pure & unit-testable: no DB, no side effects.
 *
 * @param {object|null|undefined} user
 * @param {string} [user.role]     used only by resolveProfileKey's legacy fallback
 * @param {string} [user.profile]  the active profile key (primary input)
 * @returns {{ permissions: string[], permissionsByModule: Record<string, {codes: string[], [flag: string]: boolean|string[]}> }}
 */
export function getEffectivePermissions(user) {
  if (!user) return { permissions: [], permissionsByModule: {} };

  // Profiles are the sole source of effective permissions. The resolved profile's
  // codes ARE the effective set — the legacy subRole/isSuperSales unions were removed
  // (Phase 4): they never fire on the main request path (requireAuth resolves from the
  // profile cache), and isSuperSales is not carried in the token, so the fallback
  // branches cannot re-add them. isSuperSales still influences WHICH profile
  // resolveProfileKey picks for an unmigrated row (SUPER_SALES), which already carries
  // the super-sales codes.
  const set = new Set(PROFILES[resolveProfileKey(user)] ?? []);
  return buildPermissionsByModule(Array.from(set));
}

/**
 * Pure: turn a flat array of permission codes into
 * `{ permissions, permissionsByModule }`. Each module entry keeps a `codes`
 * array (back-compat) PLUS boolean action flags (canList/canView/canCreate/...)
 * derived from NAVIGATION_PERMISSION_ACTIONS, so the FE can gate on
 * `permissionsByModule.<module>.canX` without re-deriving code strings.
 *
 * This is the single grouping routine reused by both the legacy code-map
 * resolver (`getEffectivePermissions`) and the DB-relational profile cache.
 *
 * @param {string[]} codes
 * @returns {{ permissions: string[], permissionsByModule: Record<string, {codes: string[], [flag: string]: boolean|string[]}> }}
 */
export function buildPermissionsByModule(codes) {
  const permissions = Array.from(new Set(Array.isArray(codes) ? codes : []));
  const permissionsByModule = {};
  for (const code of permissions) {
    const { module } = splitPermissionCode(code);
    const entry = (permissionsByModule[module] ??= { codes: [] });
    entry.codes.push(code);
    const actionFlag = NAVIGATION_PERMISSION_ACTIONS[module]?.[code];
    if (actionFlag) entry[actionFlag] = true;
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

/**
 * Resolve the role used for NAVIGATION filtering. The active profile drives the
 * sidebar: `navRole` (computed from currentProfile in auth.dto.toMe — it already maps
 * the SUPER_SALES profile to the super-sales sidebar) wins when present. Falls back to
 * the derived `activeRole`/`role` for unmigrated rows with no active profile.
 * @param {object} user
 * @returns {string|undefined}
 */
function navRoleFor(user) {
  if (user?.navRole) return user.navRole;
  return user?.activeRole || user?.role;
}

/**
 * Build the ordered per-role sidebar tabs from the NAVIGATION config.
 *
 * ROLE-DRIVEN (primary rule: `role ∈ item.allowedRoles`), ported 1:1 from
 * master's `linksForRole(user)`. An OPTIONAL `item.requiredPermission` acts as a
 * NON-NARROWING guard (none set today). Sub-links are ALSO role-filtered — each
 * sub-link may carry its own `allowedRoles`, so one row (e.g. "Work stages")
 * renders the correct per-role sub-list; a parent is dropped only if, after
 * filtering, it has NO surviving sub-link. Items are icon-stripped (icons are
 * FE-only). Returns `[{ key, label, href, active?, subLinks? }]` in config order.
 *
 * @param {object} user  { role, activeRole?, isSuperSales?, subRoles?, permissions? }
 * @returns {Array<{key:string,label:string,href:string,active?:string,subLinks?:Array}>}
 */
export function buildNavigationTabs(user) {
  const role = navRoleFor(user);
  if (!role) return [];

  const permissions = user?.permissions
    ? user.permissions
    : getEffectivePermissions(user).permissions;

  const out = [];
  for (const item of NAVIGATION) {
    if (!item.allowedRoles.includes(role)) continue;
    if (item.requiredPermission && !permissions.includes(item.requiredPermission)) continue;

    let subLinks;
    if (item.subLinks?.length) {
      const filtered = item.subLinks
        .filter((s) => !s.allowedRoles || s.allowedRoles.includes(role))
        .map(({ label, href, active }) => ({ label, href, ...(active ? { active } : {}) }));
      // Drop a parent that has sub-links in config but none for this role.
      if (filtered.length === 0) continue;
      subLinks = filtered;
    }

    out.push({
      key: item.key,
      label: item.label,
      href: item.href,
      ...(item.active ? { active: item.active } : {}),
      ...(subLinks ? { subLinks } : {}),
    });
  }
  return out;
}
