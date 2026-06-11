// Message map for the app-shell nav (groups + items). Keeps visible strings OUT of the
// nav.config logic (labelKey → label here). Single source for the side-nav copy.
//
// BILINGUAL (Phase 1): the labels now live in the bilingual uiDictionary under "nav.group.*" /
// "nav.item.*". The resolvers take an optional `lang` (DEFAULT "ar") and translate via the
// dictionary, so an unqualified call resolves to the SAME Arabic label as before (the dictionary's
// ar side is copied verbatim from the old maps). Callers that know the current language
// (AppSidebar/breadcrumbs via useT) pass it to get the English labels.

import { translate } from "@/app/v2/lib/i18n/uiDictionary";

/** Resolve a nav group key to its label in `lang` (default "ar"). */
export const resolveNavGroup = (key, lang = "ar") =>
  translate(lang, `nav.group.${key}`, key);
/** Resolve a nav item labelKey to its label in `lang` (default "ar"). */
export const resolveNavItem = (key, lang = "ar") =>
  translate(lang, `nav.item.${key}`, key);

// ─────────────────────────────────────────────────────────────────────────────
// Explicit LANDING DESTINATION override per role (audit H1). Some personas should land on a
// SPECIFIC screen rather than "the first destination of their default workspace". Sales personas
// (STAFF / SUPER_SALES / CONTACT_INITIATOR) land on the daily cockpit — their real starting
// point — instead of the dashboard. Keys are the Prisma UserRole enum values. When a role has no
// override here, the caller falls back to the resolved-default-workspace's first destination.
// This is display-only landing preference, NEVER a gate (the server still enforces access).
// ─────────────────────────────────────────────────────────────────────────────
export const DEFAULT_DESTINATION_BY_ROLE = {
  STAFF: "/v2/leads/workspace",
  SUPER_SALES: "/v2/leads/workspace",
  CONTACT_INITIATOR: "/v2/leads/workspace",
};

/**
 * The explicit landing href for a user's role, or null when there's no override. Super-sales is a
 * staff power-flag (not a base role) — treat it as a sales persona too. The caller should only
 * honour this when the destination is actually reachable for the user (it always falls back to
 * the resolved-workspace first destination otherwise).
 *
 * @param {object} user  auth user (activeRole/role/isSuperSales display fields).
 */
export function resolveDefaultDestination(user) {
  const role = user?.activeRole ?? user?.role;
  if (DEFAULT_DESTINATION_BY_ROLE[role]) return DEFAULT_DESTINATION_BY_ROLE[role];
  if (user?.isSuperSales) return DEFAULT_DESTINATION_BY_ROLE.SUPER_SALES;
  return null;
}
