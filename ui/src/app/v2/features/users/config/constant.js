// Users domain — API contract surface. All paths are RELATIVE to the v2 API base
// (apiFetch is configured with config.apiUrl === /v2; e.g. "users" → /v2/users). One
// place to edit if a backend path changes (reconciliation point vs
// server/src/modules/users/user/user.routes.js and
// server/src/modules/admin-residual/staff/staff.routes.js).
//
// Backend contract (confirmed against the v2 route files):
//   AUTHED user surface, mounted at /v2/users. Auth mounted once at the router; each route
//   declares its USER.* permission code. The self-profile routes ALSO carry the object-scope
//   checker (self OR admin-tier — the IDOR fix). Route order: literal paths are declared
//   BEFORE the `/:userId` catch-all, and the sub-resource literals (logs/last-seen/roles/
//   restricted-countries/auto-assignments/staff-extra) are declared before PUT|PATCH /:userId.
//   /v2/users:
//     ── directory (broad authed pick-lists; the chat module consumes these) ──
//     GET    /directory                            → { items }                         [user.directory]
//     GET    /related-chat-directory               → { items }                         [user.directory]
//     ── admin management lists ──
//     GET    /all-users                            → { items } (role-grouped pick list)[user.list]
//     GET    /                                      → { items, total, page, pageSize }  [user.list]
//                                              query: page,limit,filters,search (.passthrough — legacy-tolerant)
//                                              each item carries capabilities.* (BE-computed)
//     POST   /                                      → created user                      [user.create]
//                                              body: { email, password, name, role, telegramUsername? }
//     ── max-leads (literal-prefixed `/max-leads/:userId`, declared before /:userId) ──
//     PUT    /max-leads/:userId                     → updated user                      [user.set_max_leads]
//                                              body: { maxLeadsCounts }                 (string|number)
//     PUT    /max-leads-per-day/:userId             → updated user                      [user.set_max_leads]
//                                              body: { maxLeadCountPerDay }             (string|number)
//     ── self / admin profile (object-scope checked: self OR admin-tier — IDOR fix) ──
//     GET    /:userId/profile                       → profile object                    [user.profile.view] + scope
//     PUT    /:userId/profile                       → updated profile                   [user.profile.edit]  + scope
//                                              body: permissive; the BE usecase whitelists self-editable fields
//     ── admin user-management sub-resources (admin-tier codes) ──
//     GET    /:userId/last-seen                     → monthly activity                  [user.view_last_seen]   §5c
//     GET    /:userId/logs                          → today's notifications             [user.view_logs]        §5c
//     GET    /:userId/restricted-countries          → countries                         [user.manage_restricted_countries]
//     POST   /:userId/restricted-countries          → updated                           [user.manage_restricted_countries]
//                                              body: { countries: string[] }
//     PUT    /:userId/roles                          → updated roles                     [user.manage_roles]
//                                              body: { added: string[], removed: string[] }
//     GET    /:userId/auto-assignments              → assignments                       [user.manage_auto_assignments]
//     PUT    /:userId/auto-assignments              → updated                           [user.manage_auto_assignments]
//                                              body: { added: string[], removed: string[] }
//     PATCH  /:userId/staff-extra                    → updated staff flags               [user.manage_staff_extra]
//                                              body (.strict): { isPrimary?: boolean, isSuperSales?: boolean }
//     ── admin user CRUD by id (declared LAST so the sub-resource literals win) ──
//     PUT    /:userId                                → updated user                      [user.update]
//                                              body: { email?, password?, name?, role?, telegramUsername? }
//     PATCH  /:userId                                → status toggled (ban/unban)        [user.update]
//                                              body: { user: { isActive: boolean } }
//
//   STAFF residual read, mounted at /v2/staff (a SEPARATE gate — admits the five base
//   non-admin roles only). One route:
//     GET    /dashboard/latest-calls?staffId?       → latest-calls reminder list        [staff.latest_calls.view]
//                                              staffId is accepted for BC but IGNORED — the BE
//                                              FORCES the scope to req.auth.id (IDOR hardening).

// ── authed user surface (relative to /v2; e.g. "users") ───────────────────────────────
export const USERS_BASE = "users";

// directory pick-lists
export const USERS_DIRECTORY_URL = `${USERS_BASE}/directory`;
export const USERS_RELATED_CHAT_DIRECTORY_URL = `${USERS_BASE}/related-chat-directory`;

// admin management lists / create
export const USERS_ALL_URL = `${USERS_BASE}/all-users`;
export const USERS_URL = USERS_BASE; // GET (paginated list) , POST (create)

// max-leads (literal-prefixed by userId)
export const userMaxLeadsUrl = (userId) => `${USERS_BASE}/max-leads/${userId}`;
export const userMaxLeadsPerDayUrl = (userId) => `${USERS_BASE}/max-leads-per-day/${userId}`;

// self / admin profile (object-scope checked)
export const userProfileUrl = (userId) => `${USERS_BASE}/${userId}/profile`;

// admin user-management sub-resources
export const userLastSeenUrl = (userId) => `${USERS_BASE}/${userId}/last-seen`; // §5c
export const userLogsUrl = (userId) => `${USERS_BASE}/${userId}/logs`; // §5c
export const userRestrictedCountriesUrl = (userId) => `${USERS_BASE}/${userId}/restricted-countries`;
export const userRolesUrl = (userId) => `${USERS_BASE}/${userId}/roles`;
export const userAutoAssignmentsUrl = (userId) => `${USERS_BASE}/${userId}/auto-assignments`;
export const userStaffExtraUrl = (userId) => `${USERS_BASE}/${userId}/staff-extra`;

// admin user CRUD by id (PUT update / PATCH status)
export const userUrl = (userId) => `${USERS_BASE}/${userId}`;

// ── STAFF residual read (separate gate; relative to /v2; "staff/...") ─────────────────
export const STAFF_BASE = "staff";
export const STAFF_LATEST_CALLS_URL = `${STAFF_BASE}/dashboard/latest-calls`;
