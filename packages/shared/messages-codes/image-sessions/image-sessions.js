// image-sessions module message CODES. SCREAMING_SNAKE_CASE, key === value (the string
// IS the code). Carried in the API envelope `message` field; the client resolves
// (translationKey: imageSessionsMessages, code) → displayed string. Language-neutral —
// never put Arabic/English prose here.
//
// Covers the THREE image-session surfaces:
//   1. ADMIN reference-data CRUD (legacy `/admin/image-session/*`, ADMIN gate = the
//      `isAdmin` union: ADMIN/SUPER_ADMIN base + isSuperSales + ADMIN/SUPER_ADMIN
//      sub-roles). Global studio reference data (spaces, templates, materials, styles,
//      colors, design images, page-info, pros-and-cons) — no per-lead object scope; the
//      admin code is the gate (admins see all), matching legacy.
//   2. SHARED session-management (legacy `/shared/image-session/*`, SHARED gate = all 9
//      authed roles). ClientImageSession rows are LEAD-SCOPED; the v2 module resolves the
//      parent clientLead (directly for `:clientLeadId`, or session→clientLeadId for
//      `:sessionId`) and runs the leads-module object-scope checker (reads access-scope,
//      writes mutate-scope) before any read/write — the IDOR fix the legacy routes were
//      MISSING (no object scope at all).
//   3. PUBLIC client flow (legacy `/client/image-session/*`, token-based, NO auth). The
//      legacy handlers returned PROSE ("New session created succussfully" / "Response
//      saved succussfully" / "Error in generating pdf" / "Some thing wrong happened") —
//      every one is REPLACED here with a language-neutral code. The token IS the
//      authentication; the session is derived FROM the token, never from a client-supplied
//      id (the IDOR close vs legacy `changeSessionStatus`/`generate-pdf`, which keyed the
//      session by a raw body `id`).
//
// 🔒 PDF generation is LOGIC-FROZEN (CLAUDE.md §4) and 🔒 the upload-chunk mechanism is
// FROZEN: the v2 module only WRAPS the existing `uploadPdfAndApproveSession` →
// `generateImageSessionPdf` service via lazy adapters (IMAGE_SESSION_PDF_GENERATED is the
// success code for the public generate-pdf flow). The inline SYNC pdf path is preserved
// exactly — the legacy commented `pdfQueue.add(...)` enqueue stays commented/unused. The
// PDF logic / fonts / output and the chunk-upload flow are never touched.
export const imageSessionsMessagesCodes = {
  // ── ADMIN reference-data reads ──────────────────────────────────────────────────
  IMAGE_SESSION_REFERENCE_FETCHED: "IMAGE_SESSION_REFERENCE_FETCHED", // generic admin GET

  // ── ADMIN reference-data writes ─────────────────────────────────────────────────
  IMAGE_SESSION_SPACE_CREATED: "IMAGE_SESSION_SPACE_CREATED",
  IMAGE_SESSION_SPACE_UPDATED: "IMAGE_SESSION_SPACE_UPDATED",
  IMAGE_SESSION_TEMPLATE_CREATED: "IMAGE_SESSION_TEMPLATE_CREATED",
  IMAGE_SESSION_TEMPLATE_UPDATED: "IMAGE_SESSION_TEMPLATE_UPDATED",
  IMAGE_SESSION_MATERIAL_CREATED: "IMAGE_SESSION_MATERIAL_CREATED",
  IMAGE_SESSION_MATERIAL_UPDATED: "IMAGE_SESSION_MATERIAL_UPDATED",
  IMAGE_SESSION_STYLE_CREATED: "IMAGE_SESSION_STYLE_CREATED",
  IMAGE_SESSION_STYLE_UPDATED: "IMAGE_SESSION_STYLE_UPDATED",
  IMAGE_SESSION_COLOR_CREATED: "IMAGE_SESSION_COLOR_CREATED",
  IMAGE_SESSION_COLOR_UPDATED: "IMAGE_SESSION_COLOR_UPDATED",
  IMAGE_SESSION_IMAGE_CREATED: "IMAGE_SESSION_IMAGE_CREATED",
  IMAGE_SESSION_IMAGE_UPDATED: "IMAGE_SESSION_IMAGE_UPDATED",
  IMAGE_SESSION_PAGE_INFO_CREATED: "IMAGE_SESSION_PAGE_INFO_CREATED",
  IMAGE_SESSION_PAGE_INFO_UPDATED: "IMAGE_SESSION_PAGE_INFO_UPDATED",
  IMAGE_SESSION_PRO_CON_CREATED: "IMAGE_SESSION_PRO_CON_CREATED",
  IMAGE_SESSION_PRO_CON_UPDATED: "IMAGE_SESSION_PRO_CON_UPDATED",
  IMAGE_SESSION_PRO_CON_DELETED: "IMAGE_SESSION_PRO_CON_DELETED",
  IMAGE_SESSION_PRO_CON_REORDERED: "IMAGE_SESSION_PRO_CON_REORDERED",
  IMAGE_SESSION_PAGE_INFO_TYPE_EXISTS: "IMAGE_SESSION_PAGE_INFO_TYPE_EXISTS", // P2002 unique_type

  // ── SHARED session-management (lead-scoped) ───────────────────────────────────────
  IMAGE_SESSIONS_FETCHED: "IMAGE_SESSIONS_FETCHED", // GET /:clientLeadId/sessions
  IMAGE_SESSION_CREATED: "IMAGE_SESSION_CREATED", // POST /:clientLeadId/sessions
  IMAGE_SESSION_UPDATED: "IMAGE_SESSION_UPDATED", // PUT /:clientLeadId/sessions/:sessionId
  IMAGE_SESSION_TOKEN_REGENERATED: "IMAGE_SESSION_TOKEN_REGENERATED", // PUT .../re-generate
  IMAGE_SESSION_DELETED: "IMAGE_SESSION_DELETED", // DELETE /:clientLeadId/sessions/:sessionId
  IMAGE_SESSION_MODEL_IDS_FETCHED: "IMAGE_SESSION_MODEL_IDS_FETCHED", // GET /ids

  // ── PUBLIC client flow ─────────────────────────────────────────────────────────────
  IMAGE_SESSION_PAGE_INFO_FETCHED: "IMAGE_SESSION_PAGE_INFO_FETCHED",
  IMAGE_SESSION_PROS_CONS_FETCHED: "IMAGE_SESSION_PROS_CONS_FETCHED",
  IMAGE_SESSION_SESSION_FETCHED: "IMAGE_SESSION_SESSION_FETCHED", // GET /session?token=
  IMAGE_SESSION_STATUS_UPDATED: "IMAGE_SESSION_STATUS_UPDATED", // PUT /session/status
  IMAGE_SESSION_COLORS_FETCHED: "IMAGE_SESSION_COLORS_FETCHED",
  IMAGE_SESSION_COLOR_SAVED: "IMAGE_SESSION_COLOR_SAVED",
  IMAGE_SESSION_MATERIALS_FETCHED: "IMAGE_SESSION_MATERIALS_FETCHED",
  IMAGE_SESSION_MATERIAL_SAVED: "IMAGE_SESSION_MATERIAL_SAVED",
  IMAGE_SESSION_STYLES_FETCHED: "IMAGE_SESSION_STYLES_FETCHED",
  IMAGE_SESSION_STYLE_SAVED: "IMAGE_SESSION_STYLE_SAVED",
  IMAGE_SESSION_IMAGES_FETCHED: "IMAGE_SESSION_IMAGES_FETCHED",
  IMAGE_SESSION_IMAGES_SAVED: "IMAGE_SESSION_IMAGES_SAVED",
  IMAGE_SESSION_IMAGE_DELETED: "IMAGE_SESSION_IMAGE_DELETED",
  IMAGE_SESSION_PDF_GENERATED: "IMAGE_SESSION_PDF_GENERATED", // POST /generate-pdf (🔒 wraps frozen builder)
  // public client EXTRAS router (legacy `routes/client/image-session.js`, same base)
  IMAGE_SESSION_MODEL_FETCHED: "IMAGE_SESSION_MODEL_FETCHED", // GET /data?model=
  IMAGE_SESSION_PATTERNS_SAVED: "IMAGE_SESSION_PATTERNS_SAVED", // POST /save-patterns
  IMAGE_SESSION_SELECTION_SAVED: "IMAGE_SESSION_SELECTION_SAVED", // POST /save-images

  // ── errors / domain rules ──────────────────────────────────────────────────────────
  IMAGE_SESSION_NOT_FOUND: "IMAGE_SESSION_NOT_FOUND", // session id resolves to nothing
  IMAGE_SESSION_TOKEN_INVALID: "IMAGE_SESSION_TOKEN_INVALID", // missing/invalid session token
  IMAGE_SESSION_MODEL_NOT_ALLOWED: "IMAGE_SESSION_MODEL_NOT_ALLOWED", // generic-model read off the allow-list
  IMAGE_SESSION_PDF_GENERATION_FAILED: "IMAGE_SESSION_PDF_GENERATION_FAILED", // PDF builder threw (public flow)
};
