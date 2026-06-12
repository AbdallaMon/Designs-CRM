// Utilities domain — API contract surface. All paths are relative to the v2 API base
// (apiFetch is configured with config.apiUrl === /v2). One place to edit if a backend path
// changes (reconciliation point vs server/src/modules/utilities/utility.route.js +
// utility.validation.js + packages/shared UTILITY_MODEL_ALLOWLIST/PROJECTIONS).
//
// Backend contract (confirmed against utility.route.js / utility.validation.js):
//   The lookup/pick-list helper surface, mounted at /v2/utilities. Auth mounted ONCE; each
//   route declares its UTILITY.* permission code (all granted to every authed role). Generic
//   reads have no per-record owner to scope-check (the CODE is the gate, matching legacy).
//
//   GET  /fixed-data                              → fixed-data list           [utility.fixed_data.list]
//   GET  /user-logs        ?startTime=&endTime=   → does MY log exist? (bool) [utility.user_log.view]
//   POST /user-logs        body { date, description, totalMinutes? }          [utility.user_log.submit]
//   GET  /users/role/:userId                      → { role }                  [utility.user_role.view]
//   GET  /users/admins                            → active admins             [utility.admin.list]
//   GET  /roles            ?userId=               → role + sub-roles (array)   [utility.user_role.view]
//   GET  /images           ?patternIds=&spaceIds= → images by pattern/space   [utility.image.list]
//   GET  /search           ?... (cross-model)     → search results            [utility.search]
//   GET  /ids              ?model=                → pick-list (id + label)     [utility.model.read]
//   GET  /                 ?model=                → pick-list (id + label)     [utility.model.read]
//
// §5c CONTRACT DELTAS baked in here:
//   • USER-LOGS (GET /user-logs): SELF-SCOPED — NO `userId` param. The subject is the
//     authenticated caller (utility.usecase.js derives it from authUser.id; the .strict()
//     userLogQuery would 422 a smuggled userId). Same for POST /user-logs (no userId in body).
//   • MODEL PICK-LISTS (GET / and /ids): the `model=` names CHANGED to real Prisma delegates.
//     Allowed model names (UTILITY_MODEL_ALLOWLIST) — confirmed against the BE:
//        designImage  (was the bogus `image`)
//        colorPattern (was the bogus `pattern` / `color`)
//        space, material, style
//        fixedData
//     `imageSession` is REMOVED. Client select/include/where are NO LONGER honored — the BE
//     applies a FIXED server-side projection (UTILITY_MODEL_PROJECTIONS):
//        designImage  → { id, imageUrl }                      (scalar label proxy)
//        fixedData    → { id, title }                          (scalar title)
//        colorPattern/space/material/style → { id, title: [{ id, text }] }
//             ↑ title is a TextShort[] RELATION ARRAY — read the label as `row.title[0]?.text`.

// ── allowed model pick-list names (mirror of UTILITY_MODEL_ALLOWLIST; the BE rejects others
//    with MODEL_NOT_ALLOWED). Kept here as the single FE-side reconciliation list. ──────────
export const UTILITY_MODELS = Object.freeze({
  DESIGN_IMAGE: "designImage",
  COLOR_PATTERN: "colorPattern",
  SPACE: "space",
  MATERIAL: "material",
  STYLE: "style",
  FIXED_DATA: "fixedData",
});

// Models whose label is a TextShort[] relation array → read `row.title[0]?.text`.
export const UTILITY_TITLE_RELATION_MODELS = Object.freeze([
  UTILITY_MODELS.COLOR_PATTERN,
  UTILITY_MODELS.SPACE,
  UTILITY_MODELS.MATERIAL,
  UTILITY_MODELS.STYLE,
]);

export const UTILITIES_BASE = "utilities";

export const FIXED_DATA_URL = `${UTILITIES_BASE}/fixed-data`;
export const USER_LOGS_URL = `${UTILITIES_BASE}/user-logs`; // GET (self) + POST (self) — NO userId
export const userRoleUrl = (userId) => `${UTILITIES_BASE}/users/role/${userId}`;
export const ADMINS_URL = `${UTILITIES_BASE}/users/admins`;
export const ROLES_URL = `${UTILITIES_BASE}/roles`;
export const IMAGES_URL = `${UTILITIES_BASE}/images`;
export const SEARCH_URL = `${UTILITIES_BASE}/search`;
export const MODEL_IDS_URL = `${UTILITIES_BASE}/ids`; // ?model=
export const MODEL_URL = UTILITIES_BASE; // GET / — ?model=

// ── Fixed-data WRITES live in the admin-residual module, NOT the utilities module ─────────
// The GET read is `/v2/utilities/fixed-data` (UTILITY.FIXED_DATA_LIST), but the legacy admin
// WRITES were migrated to `/v2/admin/fixed-data*` under admin-residual (gated by
// ADMIN_RESIDUAL.FIXED_DATA_MANAGE — ADMIN/SUPER_ADMIN + isSuperSales). Reconciled against
// server/src/modules/admin-residual/fixed-data/fixed-data.routes.js + .validation.js:
//   POST   /v2/admin/fixed-data        body { title, description? }   → create
//   PUT    /v2/admin/fixed-data/:id     body { title?, description? }   → update (≥1 field)
//   DELETE /v2/admin/fixed-data/:id                                     → delete
// The full row read returns { id, title, description, createdAt } (no per-record capabilities).
export const ADMIN_FIXED_DATA_BASE = "admin/fixed-data";
export const ADMIN_FIXED_DATA_URL = ADMIN_FIXED_DATA_BASE;
export const adminFixedDataUrl = (id) => `${ADMIN_FIXED_DATA_BASE}/${id}`;
