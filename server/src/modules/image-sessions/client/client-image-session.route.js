// image-sessions/client routes — the PUBLIC client image-selection surface. Legacy: TWO
// routers BOTH mounted at `/client/image-session` via `routes/clients/clients.js`:
//   1. `routes/image-session/client-image-session.js` (mounted FIRST)
//   2. `routes/client/image-session.js` — the EXTRAS router (mounted SECOND)
// Combined here cleanly under `/v2/client/image-session`, preserving every REACHABLE path.
//
// PUBLIC BY DESIGN — NO requireAuth, NO requirePermissions, NO permission code. Every
// endpoint is authenticated by the per-session ClientImageSession.token, exactly like the
// public calendar booking flow and `/files/client/*`. Gating these would break the public
// client image-selection flow (a client has no login session). The session is derived FROM
// the token inside the usecase, never from a client-supplied id (the IDOR close vs legacy,
// which keyed saves/status/pdf by a raw body `session.id` / `id` / `sessionData.id`).
//
// TWO-ROUTERS-SAME-BASE RESOLUTION: the extras router's `GET /images` is SHADOWED by the
// main router's `GET /images` (the main router was mounted first), so it was DEAD in legacy
// and is intentionally NOT mapped. The reachable extras endpoints are `/data`,
// `/save-patterns`, `/save-images` (no path collision with the main router) — mapped below.
// Legacy also had a duplicate `POST /save-images` in the extras router itself; the SECOND
// was dead (Express uses the first registered) — only the first (submitSelectedImages) is
// mapped.
//
// ROUTE ORDERING: literal `/session/status` before `/session`; `/images/:imageId` (DELETE)
// is distinct from `/images` (GET/POST).
//
// 🔒 /generate-pdf wraps the FROZEN uploadPdfAndApproveSession → generateImageSessionPdf via
// a lazy adapter — the PDF logic / fonts / output are never touched, the INLINE SYNC path is
// preserved, and the legacy commented `pdfQueue.add(...)` enqueue stays unused. 🔒 The
// signature image arrives via the FROZEN chunk-upload; signatureUrl is SSRF-locked here.
//
// Endpoint map (legacy → v2 `/v2/client/image-session/*`, paths 1:1; PUBLIC):
//   [main]   GET  /page-info                 GET  /pros-and-cons
//   [main]   GET  /session                   PUT  /session/status
//   [main]   GET  /colors        POST /colors
//   [main]   GET  /materials     POST /materials
//   [main]   GET  /styles        POST /styles
//   [main]   GET  /images        POST /images        DELETE /images/:imageId
//   [main]   POST /generate-pdf  (🔒 inline sync frozen PDF)
//   [extras] GET  /data          POST /save-patterns  POST /save-images
import { Router } from "express";
import { asyncHandler } from "../../../shared/middlewares/async-handler.js";
import { validate } from "../../../shared/middlewares/validate.middleware.js";
import { clientImageSessionController as c } from "./client-image-session.controller.js";
import { ClientImageSessionValidation as V } from "./client-image-session.validation.js";

const router = Router();

// ── reference-data reads ────────────────────────────────────────────────────────────────
router.get("/page-info", validate(V.pageInfoQuery, "query"), asyncHandler(c.getPageInfo));
router.get("/pros-and-cons", validate(V.prosConsQuery, "query"), asyncHandler(c.getProsAndCons));

// ── session (literal /session/status before /session) ──────────────────────────────────
router.put("/session/status", validate(V.changeStatus), asyncHandler(c.changeStatus));
router.get("/session", validate(V.sessionQuery, "query"), asyncHandler(c.getSession));

// ── colors ──────────────────────────────────────────────────────────────────────────────
router.get("/colors", validate(V.lngQuery, "query"), asyncHandler(c.getColors));
router.post("/colors", validate(V.saveColor), asyncHandler(c.saveColor));

// ── materials ──────────────────────────────────────────────────────────────────────────
router.get("/materials", validate(V.lngQuery, "query"), asyncHandler(c.getMaterials));
router.post("/materials", validate(V.saveMaterials), asyncHandler(c.saveMaterials));

// ── styles ──────────────────────────────────────────────────────────────────────────────
router.get("/styles", validate(V.lngQuery, "query"), asyncHandler(c.getStyles));
router.post("/styles", validate(V.saveStyle), asyncHandler(c.saveStyle));

// ── images ──────────────────────────────────────────────────────────────────────────────
router.get("/images", validate(V.imagesQuery, "query"), asyncHandler(c.getImages));
router.post("/images", validate(V.saveImages), asyncHandler(c.saveImages));
// DELETE is token-scoped (IDOR close): the session token in the body authenticates the
// caller; the usecase confirms the :imageId belongs to that token's session before deleting.
router.delete(
  "/images/:imageId",
  validate(V.imageIdParam, "params"),
  validate(V.deleteImage),
  asyncHandler(c.deleteImage),
);

// ── 🔒 generate-pdf (inline SYNC frozen-PDF path) ───────────────────────────────────────
router.post("/generate-pdf", validate(V.generatePdf), asyncHandler(c.generatePdf));

// ── EXTRAS router endpoints (same base, no collision with the main router) ───────────────
router.get("/data", validate(V.modelDataQuery, "query"), asyncHandler(c.modelData));
router.post("/save-patterns", validate(V.savePatterns), asyncHandler(c.savePatterns));
router.post("/save-images", validate(V.saveSelection), asyncHandler(c.saveSelectionByToken));

export { router as clientImageSessionRouter };
