// Utilities data-access service — the ONLY place that talks to the utilities API. Wraps the
// canonical apiFetch (config.apiUrl === /v2). Components/hooks call these helpers, never
// fetch/apiFetch directly. All responses share the { success, message, data, translationKey }
// envelope; helpers return the parsed envelope.
//
// §5c CONTRACT DELTAS applied here:
//   • user-logs (GET + POST) are SELF-SCOPED — NO userId is sent (line ~46/~52). The subject is
//     the authenticated caller server-side; the .strict() BE schemas would 422 a smuggled userId.
//   • model pick-lists (getModel/getModelIds) accept ONLY a `model` query param (the new Prisma
//     delegate names from UTILITY_MODELS, line ~63/~67). Client select/include/where are dropped
//     by the BE (.strict() modelQuery) — we never send them. Use readModelLabel() to read the
//     label uniformly across the relation-titled vs scalar-titled vs imageUrl projections.

import apiFetch from "@/app/v2/lib/api/ApiFetch";
import {
  FIXED_DATA_URL,
  USER_LOGS_URL,
  userRoleUrl,
  ADMINS_URL,
  ROLES_URL,
  IMAGES_URL,
  SEARCH_URL,
  MODEL_IDS_URL,
  MODEL_URL,
  UTILITY_TITLE_RELATION_MODELS,
} from "./config/constant.js";

// Build a query string with top-level params (skips empty/null/undefined).
function buildQuery(base, params = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    qs.set(k, String(v));
  });
  const s = qs.toString();
  return s ? `${base}?${s}` : base;
}

// Pick only the whitelisted keys (the BE .strict() schemas reject extra keys).
function pick(obj, keys) {
  const out = {};
  keys.forEach((k) => {
    if (obj != null && obj[k] !== undefined && obj[k] !== null && obj[k] !== "") out[k] = obj[k];
  });
  return out;
}

export const utilitiesService = {
  // GET /fixed-data                                                       [utility.fixed_data.list]
  listFixedData: () => apiFetch.get(FIXED_DATA_URL),

  // GET /user-logs ?startTime=&endTime= — SELF-SCOPED (no userId)         [utility.user_log.view]
  checkUserLog: ({ startTime, endTime } = {}) =>
    apiFetch.get(buildQuery(USER_LOGS_URL, { startTime, endTime })),
  // POST /user-logs — SELF-SCOPED (no userId); body matches the .strict() schema [utility.user_log.submit]
  submitUserLog: (body) =>
    apiFetch.post(USER_LOGS_URL, pick(body, ["date", "description", "totalMinutes"])),

  // GET /users/role/:userId → { role }                                    [utility.user_role.view]
  getUserRole: (userId) => apiFetch.get(userRoleUrl(userId)),
  // GET /roles ?userId= → [ ...subRoles, role ]                           [utility.user_role.view]
  getRoles: ({ userId } = {}) => apiFetch.get(buildQuery(ROLES_URL, { userId })),
  // GET /users/admins → active admins                                     [utility.admin.list]
  getAdmins: () => apiFetch.get(ADMINS_URL),

  // GET /images ?patternIds=&spaceIds= (CSV id lists)                     [utility.image.list]
  getImages: ({ patternIds, spaceIds } = {}) =>
    apiFetch.get(buildQuery(IMAGES_URL, { patternIds, spaceIds })),

  // GET /search ?... (cross-model)                                        [utility.search]
  search: (params = {}) => apiFetch.get(buildQuery(SEARCH_URL, params)),

  // GET / ?model= → pick-list (id + fixed label projection)              [utility.model.read]
  // `model` MUST be one of UTILITY_MODELS (the new Prisma delegate names). select/include/where
  // are NOT sent (the BE ignores them).
  getModel: (model) => apiFetch.get(buildQuery(MODEL_URL, { model })),
  // GET /ids ?model= → same safe pick-list                               [utility.model.read]
  getModelIds: (model) => apiFetch.get(buildQuery(MODEL_IDS_URL, { model })),
};

/**
 * Read the human label of a pick-list row uniformly across the §5c fixed projections:
 *   • relation-titled models (colorPattern/space/material/style) → title is a TextShort[]
 *     array → row.title[0]?.text
 *   • fixedData → scalar row.title
 *   • designImage → no title; the label proxy is row.imageUrl
 * @param {string} model  one of UTILITY_MODELS
 * @param {object} row    a pick-list row from getModel/getModelIds
 */
export function readModelLabel(model, row) {
  if (!row) return "";
  if (UTILITY_TITLE_RELATION_MODELS.includes(model)) {
    return row.title?.[0]?.text ?? "";
  }
  if (typeof row.title === "string") return row.title; // fixedData
  return row.imageUrl ?? ""; // designImage (label proxy)
}

export default utilitiesService;
