// image-sessions/session routes — the SHARED, lead-scoped session-management surface
// (legacy `routes/image-session/image-session.js`, mounted `/shared/image-session` behind
// the SHARED gate = all 9 authed roles). Mounted here under `/v2/image-session` (mirrors
// the legacy `/shared/image-session` path). Authentication is mounted ONCE; every route
// declares its IMAGE_SESSION.SESSION_* code (granted to every authed role via SHARED_AUTHED
// — reproducing the legacy SHARED gate exactly).
//
// OBJECT SCOPE (the IDOR fix the legacy routes were MISSING): ClientImageSession rows are
// lead-scoped. No route-level requireSpecialChecker — the check is in the usecase, which
// resolves the parent clientLead (directly for :clientLeadId, or via session→clientLeadId
// for :sessionId) and runs the leads-module checker (access for reads, mutate for writes)
// before any read/write. The acting userId comes from req.auth, never the body.
//
// ROUTE ORDERING: the literal `/ids` is declared BEFORE the `/:clientLeadId/sessions` routes
// (different segment count, but kept first for clarity).
//
// Endpoint map (legacy `/shared/image-session/*` → v2 `/v2/image-session/*`, paths 1:1):
//   GET    /:clientLeadId/sessions                          → same (lead-scoped read)
//   POST   /:clientLeadId/sessions                          → same (lead-scoped write)
//   PUT    /:clientLeadId/sessions/:sessionId               → same (lead-scoped write)
//   PUT    /:clientLeadId/sessions/:sessionId/re-generate   → same (lead-scoped write)
//   DELETE /:clientLeadId/sessions/:sessionId               → same (lead-scoped write)
//   GET    /ids                                             → same (global pick-list + allow-list)
import { Router } from "express";
import { AuthMiddleware } from "../../../shared/middlewares/auth.middleware.js";
import { asyncHandler } from "../../../shared/middlewares/async-handler.js";
import { validate } from "../../../shared/middlewares/validate.middleware.js";
import { PERMISSIONS } from "@dms/shared";
import { imageSessionController } from "./image-session.controller.js";
import { ImageSessionValidation as V } from "./image-session.validation.js";

const P = PERMISSIONS.IMAGE_SESSION;
const router = Router();

router.use(AuthMiddleware.requireAuth);

// ── global pick-list model-id helper (literal — declared first) ─────────────────────────
router.get(
  "/ids",
  AuthMiddleware.requirePermissions([P.SESSION_VIEW]),
  validate(V.modelIdsQuery, "query"),
  asyncHandler(imageSessionController.modelIds),
);

// ── lead-scoped session list + create ─────────────────────────────────────────────────
router.get(
  "/:clientLeadId/sessions",
  AuthMiddleware.requirePermissions([P.SESSION_VIEW]),
  validate(V.clientLeadIdParam, "params"),
  asyncHandler(imageSessionController.listForLead),
);
router.post(
  "/:clientLeadId/sessions",
  AuthMiddleware.requirePermissions([P.SESSION_MANAGE]),
  validate(V.clientLeadIdParam, "params"),
  validate(V.createSession),
  asyncHandler(imageSessionController.createForLead),
);

// ── per-session writes (lead-scoped via session→lead resolution) ─────────────────────────
router.put(
  "/:clientLeadId/sessions/:sessionId/re-generate",
  AuthMiddleware.requirePermissions([P.SESSION_MANAGE]),
  validate(V.sessionParams, "params"),
  asyncHandler(imageSessionController.regenerateToken),
);
router.put(
  "/:clientLeadId/sessions/:sessionId",
  AuthMiddleware.requirePermissions([P.SESSION_MANAGE]),
  validate(V.sessionParams, "params"),
  validate(V.editSession),
  asyncHandler(imageSessionController.editFields),
);
router.delete(
  "/:clientLeadId/sessions/:sessionId",
  AuthMiddleware.requirePermissions([P.SESSION_MANAGE]),
  validate(V.sessionParams, "params"),
  asyncHandler(imageSessionController.deleteSession),
);

export { router as imageSessionRouter };
