// Users data-access service — the ONLY place that talks to the users/staff API. Wraps the
// canonical apiFetch (config.apiUrl === /v2). Components/hooks call these helpers, never
// fetch/apiFetch directly. All responses share the { success, message, data, translationKey }
// envelope; helpers return the parsed envelope. One fn per endpoint; method/path/permission
// documented inline. Mirrors features/leads/leads.service.js + features/calendar/calendar.service.js.
//
// Surfaces covered:
//  • DIRECTORY      — broad authed pick-lists (chat consumers)            [user.directory]
//  • PROFILE        — self OR admin-tier (object-scope checked by the BE) [user.profile.view / .edit]
//  • MANAGEMENT     — full admin user-management surface (list/create/update/status/roles/
//                     restricted-countries/auto-assignments/max-leads/staff-extra/logs/last-seen)
//  • STAFF residual — latest-calls reminder read (separate gate)          [staff.latest_calls.view]
//
// §5c delta: user-management is the home for the admin-on-behalf log/last-seen reads
// (user.view_logs / user.view_last_seen) — getUserLogs/getUserLastSeen below. The utilities
// user-logs surface is self-scoped only; THESE are the userId-targeted admin reads.

import apiFetch from "@/app/v2/lib/api/ApiFetch";
import {
  USERS_DIRECTORY_URL,
  USERS_RELATED_CHAT_DIRECTORY_URL,
  USERS_ALL_URL,
  USERS_URL,
  userMaxLeadsUrl,
  userMaxLeadsPerDayUrl,
  userProfileUrl,
  userLastSeenUrl,
  userLogsUrl,
  userRestrictedCountriesUrl,
  userRolesUrl,
  userAutoAssignmentsUrl,
  userStaffExtraUrl,
  userUrl,
  STAFF_LATEST_CALLS_URL,
} from "./config/constant.js";

// Build a query string from top-level params (skips empty/null/undefined).
function buildQuery(base, params = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    qs.set(k, String(v));
  });
  const s = qs.toString();
  return s ? `${base}?${s}` : base;
}

// Build the BE paginated list query. The management list tolerates extra keys (.passthrough);
// it reads page/limit and (legacy-compatibly) a JSON `filters` string + `search` + extras.
function buildListQuery(base, { page = 1, limit = 10, filters = {}, search = "", extra = {} } = {}) {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("limit", String(limit));
  params.set("filters", JSON.stringify(filters ?? {}));
  if (search) params.set("search", String(search));
  Object.entries(extra).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") params.set(k, String(v));
  });
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}

// Pick only whitelisted keys (the staff-extra body is a BE .strict() schema).
function pick(obj, keys) {
  const out = {};
  keys.forEach((k) => {
    if (obj != null && obj[k] !== undefined) out[k] = obj[k];
  });
  return out;
}

export const usersService = {
  // ── directory pick-lists (broad authed surface) ─────────────────────────────────────
  // GET /directory → { items }                                              [user.directory]
  getDirectory: (params = {}) => apiFetch.get(buildQuery(USERS_DIRECTORY_URL, params)),
  // GET /related-chat-directory → { items }                                 [user.directory]
  getRelatedChatDirectory: (params = {}) =>
    apiFetch.get(buildQuery(USERS_RELATED_CHAT_DIRECTORY_URL, params)),

  // ── admin management list / create ──────────────────────────────────────────────────
  // GET / → { items, total, page, pageSize } (each item carries capabilities.*) [user.list]
  listUsers: (opts = {}) => apiFetch.get(buildListQuery(USERS_URL, opts)),
  // GET /all-users → { items } (role-grouped pick list)                     [user.list]
  getAllUsers: (params = {}) => apiFetch.get(buildQuery(USERS_ALL_URL, params)),
  // POST / → created user; body { email, password, name, role, telegramUsername? } [user.create]
  createUser: (body) => apiFetch.post(USERS_URL, body),

  // ── self / admin profile (object-scope checked by the BE: self OR admin-tier) ───────
  // GET /:userId/profile → profile object                                   [user.profile.view]
  getProfile: (userId) => apiFetch.get(userProfileUrl(userId)),
  // PUT /:userId/profile → updated profile; body permissive (BE whitelists)  [user.profile.edit]
  updateProfile: (userId, body) => apiFetch.put(userProfileUrl(userId), body),

  // ── admin user CRUD by id ───────────────────────────────────────────────────────────
  // PUT /:userId → updated user; body { email?, password?, name?, role?, telegramUsername? } [user.update]
  updateUser: (userId, body) => apiFetch.put(userUrl(userId), body),
  // PATCH /:userId → status toggled; body { user: { isActive } } (ban/unban)  [user.update]
  changeStatus: (userId, isActive) =>
    apiFetch.patch(userUrl(userId), { user: { isActive: Boolean(isActive) } }),

  // ── roles ───────────────────────────────────────────────────────────────────────────
  // PUT /:userId/roles → updated; body { added: string[], removed: string[] } [user.manage_roles]
  manageRoles: (userId, { added = [], removed = [] } = {}) =>
    apiFetch.put(userRolesUrl(userId), { added, removed }),

  // ── restricted countries ────────────────────────────────────────────────────────────
  // GET /:userId/restricted-countries → countries           [user.manage_restricted_countries]
  getRestrictedCountries: (userId) => apiFetch.get(userRestrictedCountriesUrl(userId)),
  // POST /:userId/restricted-countries → updated; body { countries: string[] }
  //                                                        [user.manage_restricted_countries]
  updateRestrictedCountries: (userId, { countries = [] } = {}) =>
    apiFetch.post(userRestrictedCountriesUrl(userId), { countries }),

  // ── auto-assignments ────────────────────────────────────────────────────────────────
  // GET /:userId/auto-assignments → assignments             [user.manage_auto_assignments]
  getAutoAssignments: (userId) => apiFetch.get(userAutoAssignmentsUrl(userId)),
  // PUT /:userId/auto-assignments → updated; body { added: string[], removed: string[] }
  //                                                        [user.manage_auto_assignments]
  updateAutoAssignments: (userId, { added = [], removed = [] } = {}) =>
    apiFetch.put(userAutoAssignmentsUrl(userId), { added, removed }),

  // ── max-leads ───────────────────────────────────────────────────────────────────────
  // PUT /max-leads/:userId → updated; body { maxLeadsCounts }               [user.set_max_leads]
  setMaxLeads: (userId, maxLeadsCounts) =>
    apiFetch.put(userMaxLeadsUrl(userId), { maxLeadsCounts }),
  // PUT /max-leads-per-day/:userId → updated; body { maxLeadCountPerDay }   [user.set_max_leads]
  setMaxLeadsPerDay: (userId, maxLeadCountPerDay) =>
    apiFetch.put(userMaxLeadsPerDayUrl(userId), { maxLeadCountPerDay }),

  // ── staff-extra (BE .strict(): ONLY the two boolean flags accepted) ─────────────────
  // PATCH /:userId/staff-extra → updated; body { isPrimary?, isSuperSales? } [user.manage_staff_extra]
  setStaffExtra: (userId, flags = {}) =>
    apiFetch.patch(userStaffExtraUrl(userId), pick(flags, ["isPrimary", "isSuperSales"])),

  // ── §5c admin-on-behalf reads (userId-targeted; the home is user-management) ─────────
  // GET /:userId/logs → today's notifications                               [user.view_logs]
  getUserLogs: (userId) => apiFetch.get(userLogsUrl(userId)),
  // GET /:userId/last-seen → monthly activity                               [user.view_last_seen]
  getUserLastSeen: (userId, params = {}) =>
    apiFetch.get(buildQuery(userLastSeenUrl(userId), params)),

  // ── STAFF residual read (separate gate; staffId accepted for BC but BE-ignored) ─────
  // GET /dashboard/latest-calls → latest-calls reminder list               [staff.latest_calls.view]
  getLatestCalls: (params = {}) => apiFetch.get(buildQuery(STAFF_LATEST_CALLS_URL, params)),
};

export default usersService;
