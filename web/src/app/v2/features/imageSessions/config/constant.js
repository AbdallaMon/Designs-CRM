// Image-sessions domain — API contract surface. All paths are RELATIVE to the v2 API base
// (apiFetch is configured with config.apiUrl === /v2). One place to edit if a backend path
// changes (reconciliation point vs server/src/modules/image-sessions/*/*.{route,validation}.js).
//
// THREE surfaces (matched 1:1 against the v2 route files):
//
//  ── Surface 1: ADMIN reference-data CRUD (AUTHED) ──────────────────────────────────────
//   Base: /v2/image-sessions/admin. Gate: IMAGE_SESSION.ADMIN_VIEW (GET), ADMIN_MANAGE
//   (writes). GLOBAL studio config — NO per-lead object scope; the admin code is the gate.
//   The list reads return the legacy service value wrapped under the standard envelope
//   `data` (§5c #1): scalar lists (space/templates/material/style/colors/page-info) → an
//   ARRAY at res.data; IMAGES are paginated → res.data === { data:[...], total, totalPages }.
//     GET  /space                       POST /space                 PUT  /space/:spaceId
//     GET  /templates    GET /templates/ids    POST /templates      PUT  /templates/:templateId
//     GET  /material                    POST /material              PUT  /material/:materialId
//     GET  /style                       POST /style                 PUT  /style/:styleId
//     GET  /colors                      POST /colors                PUT  /colors/:colorId
//     GET  /images       POST /images   POST /images/bulk           PUT  /images/:imageId
//     GET  /page-info                   POST /page-info             PUT  /page-info/:pageInfoId
//     POST /pros-and-cons   POST /pros-and-cons/order   PUT /pros-and-cons/:id   DELETE /pros-and-cons/:id
//
//  ── Surface 2: SHARED lead-scoped session management (AUTHED) ──────────────────────────
//   Base: /v2/image-session. Gate: IMAGE_SESSION.SESSION_VIEW (reads), SESSION_MANAGE
//   (writes). Object scope is enforced SERVER-SIDE (lead-scoped via the leads checker) — the
//   session dto emits NO capabilities.* → gate authed actions on the CODES only.
//     GET    /ids                                           (global pick-list model-id helper)
//     GET    /:clientLeadId/sessions
//     POST   /:clientLeadId/sessions
//     PUT    /:clientLeadId/sessions/:sessionId
//     PUT    /:clientLeadId/sessions/:sessionId/re-generate
//     DELETE /:clientLeadId/sessions/:sessionId
//
//  ── Surface 3: PUBLIC client image-selection (UNGATED — the per-session token IS the auth) ─
//   Base: /v2/client/image-session. NO AuthProvider; apiFetch.public (_skipRefresh). The
//   session is derived FROM the token server-side, never from a client-supplied id.
//     GET  /page-info        GET  /pros-and-cons
//     GET  /session          PUT  /session/status
//     GET  /colors           POST /colors
//     GET  /materials        POST /materials
//     GET  /styles           POST /styles
//     GET  /images           POST /images        DELETE /images/:imageId   (§5c #2: token in BODY)
//     POST /generate-pdf
//     GET  /data             POST /save-patterns POST /save-images

// ── Surface 1: ADMIN reference-data CRUD ────────────────────────────────────────────────
export const ADMIN_BASE = "image-sessions/admin";

// spaces
export const ADMIN_SPACES_URL = `${ADMIN_BASE}/space`;
export const adminSpaceUrl = (spaceId) => `${ADMIN_BASE}/space/${spaceId}`;
// templates
export const ADMIN_TEMPLATES_URL = `${ADMIN_BASE}/templates`;
export const ADMIN_TEMPLATE_IDS_URL = `${ADMIN_BASE}/templates/ids`;
export const adminTemplateUrl = (templateId) => `${ADMIN_BASE}/templates/${templateId}`;
// materials
export const ADMIN_MATERIALS_URL = `${ADMIN_BASE}/material`;
export const adminMaterialUrl = (materialId) => `${ADMIN_BASE}/material/${materialId}`;
// styles
export const ADMIN_STYLES_URL = `${ADMIN_BASE}/style`;
export const adminStyleUrl = (styleId) => `${ADMIN_BASE}/style/${styleId}`;
// colors
export const ADMIN_COLORS_URL = `${ADMIN_BASE}/colors`;
export const adminColorUrl = (colorId) => `${ADMIN_BASE}/colors/${colorId}`;
// design images
export const ADMIN_IMAGES_URL = `${ADMIN_BASE}/images`;
export const ADMIN_IMAGES_BULK_URL = `${ADMIN_BASE}/images/bulk`;
export const adminImageUrl = (imageId) => `${ADMIN_BASE}/images/${imageId}`;
// page-info
export const ADMIN_PAGE_INFO_URL = `${ADMIN_BASE}/page-info`;
export const adminPageInfoUrl = (pageInfoId) => `${ADMIN_BASE}/page-info/${pageInfoId}`;
// pros & cons
export const ADMIN_PROS_CONS_URL = `${ADMIN_BASE}/pros-and-cons`;
export const ADMIN_PROS_CONS_ORDER_URL = `${ADMIN_BASE}/pros-and-cons/order`;
export const adminProConUrl = (id) => `${ADMIN_BASE}/pros-and-cons/${id}`;

// ── Surface 2: SHARED lead-scoped session management ────────────────────────────────────
export const SESSION_BASE = "image-session";

export const SESSION_IDS_URL = `${SESSION_BASE}/ids`;
export const sessionsForLeadUrl = (clientLeadId) => `${SESSION_BASE}/${clientLeadId}/sessions`;
export const leadSessionUrl = (clientLeadId, sessionId) =>
  `${SESSION_BASE}/${clientLeadId}/sessions/${sessionId}`;
export const leadSessionRegenerateUrl = (clientLeadId, sessionId) =>
  `${SESSION_BASE}/${clientLeadId}/sessions/${sessionId}/re-generate`;

// ── Surface 3: PUBLIC client image-selection (token-based) ──────────────────────────────
export const CLIENT_BASE = "client/image-session";

export const CLIENT_PAGE_INFO_URL = `${CLIENT_BASE}/page-info`;
export const CLIENT_PROS_CONS_URL = `${CLIENT_BASE}/pros-and-cons`;
export const CLIENT_SESSION_URL = `${CLIENT_BASE}/session`;
export const CLIENT_SESSION_STATUS_URL = `${CLIENT_BASE}/session/status`;
export const CLIENT_COLORS_URL = `${CLIENT_BASE}/colors`;
export const CLIENT_MATERIALS_URL = `${CLIENT_BASE}/materials`;
export const CLIENT_STYLES_URL = `${CLIENT_BASE}/styles`;
export const CLIENT_IMAGES_URL = `${CLIENT_BASE}/images`;
export const clientImageUrl = (imageId) => `${CLIENT_BASE}/images/${imageId}`;
export const CLIENT_GENERATE_PDF_URL = `${CLIENT_BASE}/generate-pdf`;
export const CLIENT_DATA_URL = `${CLIENT_BASE}/data`;
export const CLIENT_SAVE_PATTERNS_URL = `${CLIENT_BASE}/save-patterns`;
export const CLIENT_SAVE_IMAGES_URL = `${CLIENT_BASE}/save-images`;
