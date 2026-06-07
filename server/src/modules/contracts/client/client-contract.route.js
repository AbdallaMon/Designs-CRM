// contracts/client routes — the PUBLIC client e-sign surface. Legacy:
// routes/contract/client-contract.js, mounted at `/client/contracts` via
// routes/clients/clients.js with NO authentication middleware (token-based). Mounted under
// v2 at `/v2/client/contracts`.
//
// PUBLIC BY DESIGN — NO `requireAuth`, NO `requirePermissions`, NO permission code. Every
// endpoint is authenticated by the per-session Contract.arToken (the e-sign token), exactly
// like the public calendar booking flow and /files/client/*. Gating these would break the
// public client signing flow (a client has no session). The session is derived FROM the
// token inside the usecase — never from a client-supplied id (the IDOR close vs legacy,
// which let `/session/status` target an arbitrary session by raw `id`).
//
// PATHS preserved 1:1 vs legacy:
//   GET  /session            PUT /session/status            POST /generate-pdf
//
// 🔒 /generate-pdf wraps the FROZEN buildAndUploadContractPdf via a lazy adapter — the PDF
// logic / fonts / output are never touched.
import { Router } from "express";
import { asyncHandler } from "../../../shared/middlewares/async-handler.js";
import { validate } from "../../../shared/middlewares/validate.middleware.js";
import { clientContractController } from "./client-contract.controller.js";
import { ClientContractValidation } from "./client-contract.validation.js";

const router = Router();

router.get(
  "/session",
  validate(ClientContractValidation.sessionQuery, "query"),
  asyncHandler(clientContractController.getSession),
);

router.put(
  "/session/status",
  validate(ClientContractValidation.changeStatus),
  asyncHandler(clientContractController.changeStatus),
);

router.post(
  "/generate-pdf",
  validate(ClientContractValidation.generatePdf),
  asyncHandler(clientContractController.generatePdf),
);

export { router as clientContractRouter };
