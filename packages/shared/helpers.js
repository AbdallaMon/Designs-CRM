// Pure, framework-agnostic cross-cutting helpers.
//
// RULES (mirrored from the reference):
//   - @dms/shared must NOT import Prisma / Express / Next. Helpers that need DB
//     access take `prisma` as a parameter; they never import the client.
//   - This file is the home for domain predicates and capability computations;
//     module migrations append theirs here.

import { splitPermissionCode } from "./constants/access/permissions.constants.js";
import { NAVIGATION, NAVIGATION_PERMISSION_ACTIONS } from "./constants/access/navigation.js";
import { PROFILES, resolveProfileKey } from "./constants/access/profiles.js";

/**
 * Compute a user's EFFECTIVE permissions, resolved via their PROFILE.
 *
 * Effective = the resolved profile's codes (see `resolveProfileKey`/`PROFILES`).
 * Profiles are the sole source of authorization.
 *
 * Pure & unit-testable: no DB, no side effects.
 *
 * @param {object|null|undefined} user
 * @param {string} [user.profile]  the active profile key (primary input)
 * @returns {{ permissions: string[], permissionsByModule: Record<string, {codes: string[], [flag: string]: boolean|string[]}> }}
 */
export function getEffectivePermissions(user) {
  if (!user) return { permissions: [], permissionsByModule: {} };

  const profileKey = resolveProfileKey(user);
  const set = new Set(profileKey ? PROFILES[profileKey] : []);
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
 * Resolve the active profile used for navigation filtering.
 * @param {object} user
 * @returns {string|undefined}
 */
function navigationProfileFor(user) {
  return resolveProfileKey(user);
}

/**
 * Build the ordered per-profile sidebar tabs from the navigation config.
 *
 * Profile membership is the primary rule; an optional required permission can narrow
 * a tab further. Sub-links are filtered by the same active profile.
 *
 * @param {object} user  { profile, permissions? }
 * @returns {Array<{key:string,label:string,href:string,active?:string,subLinks?:Array}>}
 */
export function buildNavigationTabs(user) {
  const profile = navigationProfileFor(user);
  if (!profile) return [];

  const permissions = user?.permissions
    ? user.permissions
    : getEffectivePermissions(user).permissions;

  const out = [];
  for (const item of NAVIGATION) {
    if (!item.allowedProfiles.includes(profile)) continue;
    if (item.requiredPermission && !permissions.includes(item.requiredPermission)) continue;

    let subLinks;
    if (item.subLinks?.length) {
      const filtered = item.subLinks
        .filter((s) => !s.allowedProfiles || s.allowedProfiles.includes(profile))
        .map(({ label, href, active }) => ({ label, href, ...(active ? { active } : {}) }));
      // Drop a parent that has sub-links but none for this profile.
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
