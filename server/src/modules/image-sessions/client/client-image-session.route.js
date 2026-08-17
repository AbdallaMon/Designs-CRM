// image-sessions/client routes — the PUBLIC client image-selection surface. Legacy: TWO
// routers BOTH mounted at `/client/image-session` via `routes/clients/clients.js`:
//   1. `routes/image-session/client-image-session.js` (mounted FIRST)
//   2. `routes/client/image-session.js` — the EXTRAS router (mounted SECOND)
// Combined here cleanly under `/v2/client/image-session`, preserving every REACHABLE path.
//
// Client mutations and session reads are authenticated by the per-session token. Reference
// catalog reads (which contain private image URLs) require either that token or an
// authenticated user with IMAGE_SESSION.ADMIN_VIEW. A client never needs a CRM login.
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
import { clientImageSessionController } from "./client-image-session.controller.js";
import { ClientImageSessionValidation } from "./client-image-session.validation.js";
import { AuthMiddleware } from "../../../shared/middlewares/auth.middleware.js";

const router = Router();

const referenceRead = [
  AuthMiddleware.optionalAuth,
  AuthMiddleware.requireSpecialChecker(
    clientImageSessionController.authorizeReferenceRead,
  ),
];

// ── reference-data reads ────────────────────────────────────────────────────────────────
router.get("/page-info", validate(ClientImageSessionValidation.pageInfoQuery, "query"), ...referenceRead, asyncHandler(clientImageSessionController.getPageInfo));
router.get("/pros-and-cons", validate(ClientImageSessionValidation.prosConsQuery, "query"), ...referenceRead, asyncHandler(clientImageSessionController.getProsAndCons));

// ── session (literal /session/status before /session) ──────────────────────────────────
router.put("/session/status", validate(ClientImageSessionValidation.changeStatus), asyncHandler(clientImageSessionController.changeStatus));
router.get("/session", validate(ClientImageSessionValidation.sessionQuery, "query"), asyncHandler(clientImageSessionController.getSession));

// ── colors ──────────────────────────────────────────────────────────────────────────────
router.get("/colors", validate(ClientImageSessionValidation.lngQuery, "query"), ...referenceRead, asyncHandler(clientImageSessionController.getColors));
router.post("/colors", validate(ClientImageSessionValidation.saveColor), asyncHandler(clientImageSessionController.saveColor));

// ── materials ──────────────────────────────────────────────────────────────────────────
router.get("/materials", validate(ClientImageSessionValidation.lngQuery, "query"), ...referenceRead, asyncHandler(clientImageSessionController.getMaterials));
router.post("/materials", validate(ClientImageSessionValidation.saveMaterials), asyncHandler(clientImageSessionController.saveMaterials));

// ── styles ──────────────────────────────────────────────────────────────────────────────
router.get("/styles", validate(ClientImageSessionValidation.lngQuery, "query"), ...referenceRead, asyncHandler(clientImageSessionController.getStyles));
router.post("/styles", validate(ClientImageSessionValidation.saveStyle), asyncHandler(clientImageSessionController.saveStyle));

// ── images ──────────────────────────────────────────────────────────────────────────────
router.get("/images", validate(ClientImageSessionValidation.imagesQuery, "query"), ...referenceRead, asyncHandler(clientImageSessionController.getImages));
router.post("/images", validate(ClientImageSessionValidation.saveImages), asyncHandler(clientImageSessionController.saveImages));
// DELETE is token-scoped (IDOR close): the session token in the body authenticates the
// caller; the usecase confirms the :imageId belongs to that token's session before deleting.
router.delete(
  "/images/:imageId",
  validate(ClientImageSessionValidation.imageIdParam, "params"),
  validate(ClientImageSessionValidation.deleteImage),
  asyncHandler(clientImageSessionController.deleteImage),
);

// ── 🔒 generate-pdf (inline SYNC frozen-PDF path) ───────────────────────────────────────
router.post("/generate-pdf", validate(ClientImageSessionValidation.generatePdf), asyncHandler(clientImageSessionController.generatePdf));

// ── EXTRAS router endpoints (same base, no collision with the main router) ───────────────
router.get("/data", validate(ClientImageSessionValidation.modelDataQuery, "query"), ...referenceRead, asyncHandler(clientImageSessionController.getModelData));
router.post("/save-patterns", validate(ClientImageSessionValidation.savePatterns), asyncHandler(clientImageSessionController.savePatterns));
router.post("/save-images", validate(ClientImageSessionValidation.saveSelection), asyncHandler(clientImageSessionController.saveSelectionByToken));

export { router as clientImageSessionRouter };
