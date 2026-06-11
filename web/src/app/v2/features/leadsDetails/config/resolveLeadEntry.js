// resolveLeadEntry — pure role/status-adaptive default landing resolver for the lead hub.
//
// Given the auth user, the lead payload, the resolved section `gates` (caps.* × permission
// CODES, the SAME map the page already builds), and the `visibleGroups` (groups carrying their
// `visibleSub`), returns `{ defaultGroup, defaultSub }` — the group/sub a user should land on
// when the URL carries NO ?tab/?sub. Deep links + the rail still win at the call site (this is
// ONLY the no-query fallback).
//
// Authorization is NOT re-derived here: the result is ALWAYS validated against gates +
// visibleGroups. A role's preferred section is honored only if it is actually visible to THIS
// user; otherwise we fall back to the first visible sub of the first visible group (the legacy
// `visibleGroups[0]` behavior). So a user can never be landed on a tab they cannot see.

import { locateSection } from "./leadHubTabs.js";

const DESIGNER_ROLES = ["THREE_D_DESIGNER", "TWO_D_DESIGNER", "TWO_D_EXECUTOR"];

// Roles that get the full overview-first orientation (managers / leadership).
const PRIVILEGED_ROLES = ["ADMIN", "SUPER_ADMIN"];

// Resolve a section key to its (group, sub) IFF that section is currently visible. Returns
// null when the section is gated off / not in the visible set, so the caller can fall through.
function pickIfVisible(sectionKey, gates, visibleGroups) {
  const loc = locateSection(sectionKey);
  if (!loc) return null;
  if (!gates?.[loc.gateKey]) return null;
  const group = visibleGroups.find((g) => g.key === loc.groupKey);
  if (!group) return null;
  const sub = group.visibleSub.find((s) => s.key === loc.subKey);
  if (!sub) return null;
  return { defaultGroup: group.key, defaultSub: sub.key };
}

// First visible (group, sub) — the universal safe fallback (legacy `visibleGroups[0]`).
function firstVisible(visibleGroups) {
  const group = visibleGroups[0];
  if (!group) return { defaultGroup: undefined, defaultSub: undefined };
  return { defaultGroup: group.key, defaultSub: group.visibleSub[0]?.key };
}

// The role-preferred section keys, in priority order. The FIRST one that is visible wins; if
// none are visible we fall back to the first visible group/sub.
function preferredSectionsFor(user, lead) {
  const role = user?.role;
  const isSuperSales = Boolean(user?.isSuperSales) || role === "SUPER_SALES";

  // sales / STAFF — go where the work is: if no call has been logged yet, land on calls so the
  // very first action (schedule a call) is one tap away; otherwise land on the sales stage.
  if (role === "STAFF") {
    const hasCall = Array.isArray(lead?.callReminders) && lead.callReminders.length > 0;
    return hasCall ? ["salesStage", "calls"] : ["calls", "salesStage"];
  }

  // contact-initiator — the call log is their whole job.
  if (role === "CONTACT_INITIATOR") return ["calls"];

  // accountant — money first.
  if (role === "ACCOUNTANT") return ["contracts", "payments"];

  // 3D / 2D designer + executor — production first.
  if (DESIGNER_ROLES.includes(role)) return ["sessions", "projects"];

  // super-sales + admins / super-admin — the panoramic overview.
  if (isSuperSales || PRIVILEGED_ROLES.includes(role)) return ["overview"];

  // anyone else — overview if visible, else the universal fallback.
  return ["overview"];
}

export function resolveLeadEntry(user, lead, gates, visibleGroups) {
  if (!Array.isArray(visibleGroups) || visibleGroups.length === 0) {
    return { defaultGroup: undefined, defaultSub: undefined };
  }
  const preferred = preferredSectionsFor(user, lead);
  for (const sectionKey of preferred) {
    const hit = pickIfVisible(sectionKey, gates, visibleGroups);
    if (hit) return hit;
  }
  return firstVisible(visibleGroups);
}

export default resolveLeadEntry;
