// Image-sessions data-access service — the ONLY place that talks to the image-sessions API.
// Wraps the canonical apiFetch (config.apiUrl === /v2). Components/hooks call these helpers,
// never fetch/apiFetch directly. All responses share the { success, message, data,
// translationKey } envelope; helpers return the parsed envelope.
//
// THREE surfaces:
//  • ADMIN reference-data CRUD (apiFetch.* — credentialed). Points at /v2/image-sessions/admin.
//    Gated on IMAGE_SESSION.ADMIN_* CODES (GLOBAL config, no object scope).
//  • SHARED lead-scoped session management (apiFetch.* — credentialed). Points at
//    /v2/image-session. Object scope is enforced SERVER-SIDE (lead-scoped). Gate on
//    IMAGE_SESSION.SESSION_* CODES (the dto emits NO capabilities.*).
//  • PUBLIC client image-selection (apiFetch.public.* — token-based, _skipRefresh). Points at
//    /v2/client/image-session. The per-session token IS the auth; the session is derived FROM
//    the token server-side, never a client-supplied id.
//
// §5c deltas baked in here:
//  • #1 design-images list is nested under the envelope `data` ({ data, total, totalPages }).
//    Callers read res.data.data / res.data.total for images; res.data (array) for the other
//    scalar admin lists (space/templates/material/style/colors/page-info).
//  • #2 PUBLIC DELETE /images/:imageId now REQUIRES { token } in the request BODY (the legacy
//    delete sent an empty body). deleteImage() forwards the token via the body-capable public
//    delete (apiFetch.public.delete(path, body)).
//  • #3 generic pick-list model names map to REAL Prisma delegates (image→designImage,
//    pattern/color→colorPattern, imageSession REMOVED). modelIds()/modelData() normalize the
//    model name and reject anything off the allow-list before calling the BE.

import apiFetch from "@/app/v2/lib/api/ApiFetch";
import { normalizePickListModel } from "./config/imageSessionsConstants.js";
import {
  // admin
  ADMIN_SPACES_URL,
  adminSpaceUrl,
  ADMIN_TEMPLATES_URL,
  ADMIN_TEMPLATE_IDS_URL,
  adminTemplateUrl,
  ADMIN_MATERIALS_URL,
  adminMaterialUrl,
  ADMIN_STYLES_URL,
  adminStyleUrl,
  ADMIN_COLORS_URL,
  adminColorUrl,
  ADMIN_IMAGES_URL,
  ADMIN_IMAGES_BULK_URL,
  adminImageUrl,
  ADMIN_PAGE_INFO_URL,
  adminPageInfoUrl,
  ADMIN_PROS_CONS_URL,
  ADMIN_PROS_CONS_ORDER_URL,
  adminProConUrl,
  // shared session
  SESSION_IDS_URL,
  sessionsForLeadUrl,
  leadSessionUrl,
  leadSessionRegenerateUrl,
  // public client
  CLIENT_PAGE_INFO_URL,
  CLIENT_PROS_CONS_URL,
  CLIENT_SESSION_URL,
  CLIENT_SESSION_STATUS_URL,
  CLIENT_COLORS_URL,
  CLIENT_MATERIALS_URL,
  CLIENT_STYLES_URL,
  CLIENT_IMAGES_URL,
  clientImageUrl,
  CLIENT_GENERATE_PDF_URL,
  CLIENT_DATA_URL,
  CLIENT_SAVE_PATTERNS_URL,
  CLIENT_SAVE_IMAGES_URL,
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

export const imageSessionsService = {
  // ════════════════════════════════════════════════════════════════════════════════════
  //  SURFACE 1 — ADMIN reference-data CRUD (AUTHED; gate = IMAGE_SESSION.ADMIN_*)
  // ════════════════════════════════════════════════════════════════════════════════════
  // Scalar lists: res.data is the ARRAY. notArchived is read by the BE as a flag.
  listSpaces: ({ notArchived } = {}) =>
    apiFetch.get(buildQuery(ADMIN_SPACES_URL, { notArchived })),
  createSpace: (body) => apiFetch.post(ADMIN_SPACES_URL, body),
  updateSpace: (spaceId, body) => apiFetch.put(adminSpaceUrl(spaceId), body),

  listTemplates: ({ type } = {}) => apiFetch.get(buildQuery(ADMIN_TEMPLATES_URL, { type })),
  listTemplateIds: ({ type } = {}) => apiFetch.get(buildQuery(ADMIN_TEMPLATE_IDS_URL, { type })),
  createTemplate: (body) => apiFetch.post(ADMIN_TEMPLATES_URL, body),
  updateTemplate: (templateId, body) => apiFetch.put(adminTemplateUrl(templateId), body),

  listMaterials: ({ notArchived } = {}) =>
    apiFetch.get(buildQuery(ADMIN_MATERIALS_URL, { notArchived })),
  createMaterial: (body) => apiFetch.post(ADMIN_MATERIALS_URL, body),
  updateMaterial: (materialId, body) => apiFetch.put(adminMaterialUrl(materialId), body),

  listStyles: ({ notArchived } = {}) =>
    apiFetch.get(buildQuery(ADMIN_STYLES_URL, { notArchived })),
  createStyle: (body) => apiFetch.post(ADMIN_STYLES_URL, body),
  updateStyle: (styleId, body) => apiFetch.put(adminStyleUrl(styleId), body),

  listColors: ({ notArchived } = {}) =>
    apiFetch.get(buildQuery(ADMIN_COLORS_URL, { notArchived })),
  createColor: (body) => apiFetch.post(ADMIN_COLORS_URL, body),
  updateColor: (colorId, body) => apiFetch.put(adminColorUrl(colorId), body),

  // §5c #1: design-images list is PAGINATED and nested under the envelope `data`:
  //   res.data === { data: DesignImage[], total, totalPages }
  // Callers MUST read res.data.data (the array) — NOT res.data (legacy read it top-level).
  listImages: ({ notArchived, limit, skip, page } = {}) =>
    apiFetch.get(buildQuery(ADMIN_IMAGES_URL, { notArchived, limit, skip, page })),
  createImage: (body) => apiFetch.post(ADMIN_IMAGES_URL, body),
  createBulkImage: (body) => apiFetch.post(ADMIN_IMAGES_BULK_URL, body),
  updateImage: (imageId, body) => apiFetch.put(adminImageUrl(imageId), body),

  listPageInfo: ({ notArchived } = {}) =>
    apiFetch.get(buildQuery(ADMIN_PAGE_INFO_URL, { notArchived })),
  createPageInfo: (body) => apiFetch.post(ADMIN_PAGE_INFO_URL, body),
  updatePageInfo: (pageInfoId, body) => apiFetch.put(adminPageInfoUrl(pageInfoId), body),

  // pros & cons (literal /order distinct from /:id)
  createProCon: (body) => apiFetch.post(ADMIN_PROS_CONS_URL, body),
  reorderProsCons: (body) => apiFetch.post(ADMIN_PROS_CONS_ORDER_URL, body),
  updateProCon: (id, body) => apiFetch.put(adminProConUrl(id), body),
  deleteProCon: (id, body) =>
    // DELETE /pros-and-cons/:id — the BE deleteProCon schema reads { itemType }; ApiFetch.delete
    // takes no body, so route a body-carrying delete through the generic submit helper.
    apiFetch.submit("DELETE", adminProConUrl(id), body),

  // ════════════════════════════════════════════════════════════════════════════════════
  //  SURFACE 2 — SHARED lead-scoped session management (AUTHED; gate = IMAGE_SESSION.SESSION_*)
  // ════════════════════════════════════════════════════════════════════════════════════
  // GET /ids — global pick-list model-id helper. §5c #3: normalize the (possibly legacy)
  // model name to a real Prisma delegate; reject off-list names client-side before the call.
  modelIds: ({ model, ...searchParams } = {}) => {
    const normalized = normalizePickListModel(model);
    if (!normalized) {
      return Promise.reject(new Error("IMAGE_SESSION_MODEL_NOT_ALLOWED"));
    }
    return apiFetch.get(buildQuery(SESSION_IDS_URL, { model: normalized, ...searchParams }));
  },

  // GET /:clientLeadId/sessions → res.data is the sessions array (lead-scoped).
  listSessions: (clientLeadId) => apiFetch.get(sessionsForLeadUrl(clientLeadId)),
  // POST /:clientLeadId/sessions — body (.strict): { spaces: number[] } (>=1). userId from auth.
  createSession: (clientLeadId, { spaces }) =>
    apiFetch.post(sessionsForLeadUrl(clientLeadId), { spaces }),
  // PUT /:clientLeadId/sessions/:sessionId — body (.strict): editable scalar fields only.
  editSession: (clientLeadId, sessionId, body) =>
    apiFetch.put(leadSessionUrl(clientLeadId, sessionId), body),
  // PUT .../re-generate — mints a fresh session token. No body.
  regenerateToken: (clientLeadId, sessionId) =>
    apiFetch.put(leadSessionRegenerateUrl(clientLeadId, sessionId)),
  deleteSession: (clientLeadId, sessionId) =>
    apiFetch.delete(leadSessionUrl(clientLeadId, sessionId)),

  // ════════════════════════════════════════════════════════════════════════════════════
  //  SURFACE 3 — PUBLIC client image-selection (UNGATED; token IS the auth; apiFetch.public)
  // ════════════════════════════════════════════════════════════════════════════════════
  // reference-data reads (token not required by the BE for these reference lookups)
  getPageInfo: ({ lng, type } = {}) =>
    apiFetch.public.get(buildQuery(CLIENT_PAGE_INFO_URL, { lng, type })),
  getProsAndCons: ({ id, type, lng, isClient } = {}) =>
    apiFetch.public.get(buildQuery(CLIENT_PROS_CONS_URL, { id, type, lng, isClient })),

  // session (token-keyed)
  getSession: (token) => apiFetch.public.get(buildQuery(CLIENT_SESSION_URL, { token })),
  // PUT /session/status — body (.strict): { token, sessionStatus }. NO client id (IDOR close).
  changeStatus: ({ token, sessionStatus }) =>
    apiFetch.public.put(CLIENT_SESSION_STATUS_URL, { token, sessionStatus }),

  // colors / materials / styles / images reads (lng query)
  getColors: ({ lng } = {}) => apiFetch.public.get(buildQuery(CLIENT_COLORS_URL, { lng })),
  getMaterials: ({ lng } = {}) => apiFetch.public.get(buildQuery(CLIENT_MATERIALS_URL, { lng })),
  getStyles: ({ lng } = {}) => apiFetch.public.get(buildQuery(CLIENT_STYLES_URL, { lng })),
  // §5c #1: the design-images public list is nested under the envelope `data` too — read res.data.
  getImages: ({ spaceIds, styleId } = {}) =>
    apiFetch.public.get(buildQuery(CLIENT_IMAGES_URL, { spaceIds, styleId })),

  // token-authoritative saves (the BE OVERRIDES session.id/clientLeadId from the token)
  // POST /colors — body (.strict): { session:{token,...}, selectedColor, customColors?, status }
  saveColor: ({ session, selectedColor, customColors, status }) =>
    apiFetch.public.post(CLIENT_COLORS_URL, { session, selectedColor, customColors, status }),
  // POST /materials — body (.strict): { session, selectedMaterials[], status }
  saveMaterials: ({ session, selectedMaterials, status }) =>
    apiFetch.public.post(CLIENT_MATERIALS_URL, { session, selectedMaterials, status }),
  // POST /styles — body (.strict): { session, selectedStyle, status }
  saveStyle: ({ session, selectedStyle, status }) =>
    apiFetch.public.post(CLIENT_STYLES_URL, { session, selectedStyle, status }),
  // POST /images — body (.strict): { session, selectedImages[], status }
  saveImages: ({ session, selectedImages, status }) =>
    apiFetch.public.post(CLIENT_IMAGES_URL, { session, selectedImages, status }),

  // §5c #2: DELETE /images/:imageId now REQUIRES { token } in the BODY. The legacy delete
  // button sent an empty body — this forwards the session token so the BE can confirm the
  // image belongs to the token's session before the frozen delete runs.
  deleteImage: (imageId, token) =>
    apiFetch.public.delete(clientImageUrl(imageId), { token }),

  // POST /generate-pdf — 🔒 wraps the FROZEN PDF builder. body (.strict):
  //   { sessionData:{ token, ... }, signatureUrl, sessionStatus, lng }
  // signatureUrl MUST be a RELATIVE /uploads/... path (the BE SSRF-locks it).
  generatePdf: ({ sessionData, signatureUrl, sessionStatus, lng = "ar" }) =>
    apiFetch.public.post(CLIENT_GENERATE_PDF_URL, {
      sessionData,
      signatureUrl,
      sessionStatus,
      lng,
    }),

  // EXTRAS router (same base; no collision with the main router)
  // GET /data?model= — §5c #3: normalize the model name; reject off-list before the call.
  modelData: ({ model, ...searchParams } = {}) => {
    const normalized = normalizePickListModel(model);
    if (!normalized) {
      return Promise.reject(new Error("IMAGE_SESSION_MODEL_NOT_ALLOWED"));
    }
    return apiFetch.public.get(buildQuery(CLIENT_DATA_URL, { model: normalized, ...searchParams }));
  },
  // POST /save-patterns — body (.strict): { token, patterns: number[] }
  savePatterns: ({ token, patterns }) =>
    apiFetch.public.post(CLIENT_SAVE_PATTERNS_URL, { token, patterns }),
  // POST /save-images — body (.strict): { token, imageIds: number[] }
  saveSelection: ({ token, imageIds }) =>
    apiFetch.public.post(CLIENT_SAVE_IMAGES_URL, { token, imageIds }),
};

export default imageSessionsService;
