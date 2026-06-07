// image-sessions/session usecase — business logic / orchestration ONLY for the SHARED
// session-management surface (legacy `routes/image-session/image-session.js`, mounted
// `/shared/image-session` behind the SHARED gate = all 9 authed roles). Prisma NEVER
// appears here: scope-resolution lookups go through the repo, and the heavy session CRUD
// stays in the legacy service, invoked via lazy adapters (never duplicated). Errors are
// thrown as AppError(code, statusCode); the envelope serializes them.
//
// OBJECT SCOPE — the IDOR fix the legacy `/shared/image-session/*` routes were MISSING (no
// object scope at all). ClientImageSession rows are LEAD-SCOPED. Two resolution paths:
//   - `:clientLeadId` routes → check the lead DIRECTLY (access for reads, mutate for writes).
//   - `:sessionId` routes    → resolve the session's parent clientLeadId in the repo FIRST,
//     then run the lead checker before touching the legacy service. A forged/missing id →
//     IMAGE_SESSION_NOT_FOUND (404). The acting user is derived from authUser (req.auth).
//
// GENERIC `/ids` MODEL READ: a global pick-list helper (legacy `getModelIds`). It is NOT
// lead-scoped (global config); it carries the SESSION_VIEW code as the gate AND adds a model
// allow-list (mass-read hardening) — the legacy `getModelIds` did an open `prisma[model]`
// with a client-supplied `where`/`select`/`include` (JSON.parse of an arbitrary string).
// v2 rejects any model not in UTILITY_MODEL_ALLOWLIST and guards the JSON.parse (a malformed
// `where` becomes a clean 422-class error rather than a 500), preserving the legit lookups.
import { AppError } from "../../../shared/errors/AppError.js";
import { imageSessionsMessagesCodes as M, UTILITY_MODEL_ALLOWLIST } from "@dms/shared";
import { leadUsecase } from "../../leads/lead/lead.usecase.js";
import { imageSessionRepository } from "./image-session.repository.js";

const SVC = "../../../../services/main/image-session/imageSessionSevices.js";
const ADMIN_SVC = "../../../../services/main/admin/adminServices.js";

// Lazy adapters to the not-yet-migrated legacy services (behavior-preserving).
const legacyDefaults = {
  getClientImageSessions: (clientLeadId) =>
    import(SVC).then((m) => m.getClientImageSessions(clientLeadId)),
  createClientImageSession: (a) => import(SVC).then((m) => m.createClientImageSession(a)),
  editSessionFileds: (a) => import(SVC).then((m) => m.editSessionFileds(a)),
  regenerateSessionToken: (sessionId) => import(SVC).then((m) => m.regenerateSessionToken(sessionId)),
  deleteInProgressSession: (sessionId, user) =>
    import(SVC).then((m) => m.deleteInProgressSession(sessionId, user)),
  getModelIds: (a) => import(ADMIN_SVC).then((m) => m.getModelIds(a)),
};

export class ImageSessionUsecase {
  constructor(repository = imageSessionRepository, leads = leadUsecase, legacy = {}) {
    this.repo = repository;
    this.leads = leads;
    this.legacy = { ...legacyDefaults, ...legacy };
  }

  // ── scope helpers ─────────────────────────────────────────────────────────────────
  assertLeadAccess({ clientLeadId, authUser }) {
    return this.leads.checkIfUserCanAccessLead({ id: clientLeadId, authUser });
  }
  assertLeadMutate({ clientLeadId, authUser }) {
    return this.leads.checkIfUserCanMutateLead({ id: clientLeadId, authUser });
  }

  // Resolve a `:sessionId` → its parent clientLeadId, then run the lead checker. A
  // missing/forged session → IMAGE_SESSION_NOT_FOUND (404). `mode` selects access (read)
  // vs mutate (write).
  async #scopeBySession({ sessionId, authUser, mode }) {
    const row = await this.repo.getSessionClientLeadId({ sessionId });
    if (!row || row.clientLeadId == null) throw new AppError(M.IMAGE_SESSION_NOT_FOUND, 404);
    if (mode === "mutate") await this.assertLeadMutate({ clientLeadId: row.clientLeadId, authUser });
    else await this.assertLeadAccess({ clientLeadId: row.clientLeadId, authUser });
    return row;
  }

  // GET /:clientLeadId/sessions — lead-scoped list (READ scope on the lead directly).
  async listForLead({ clientLeadId, authUser }) {
    await this.assertLeadAccess({ clientLeadId, authUser });
    return this.legacy.getClientImageSessions(Number(clientLeadId));
  }

  // POST /:clientLeadId/sessions — create a session for a lead (WRITE scope on the lead).
  // The acting userId comes from authUser (req.auth), never the body.
  async createForLead({ clientLeadId, spaces, authUser }) {
    await this.assertLeadMutate({ clientLeadId, authUser });
    return this.legacy.createClientImageSession({
      clientLeadId: Number(clientLeadId),
      userId: Number(authUser.id),
      selectedSpaceIds: spaces,
    });
  }

  // PUT /:clientLeadId/sessions/:sessionId — plain field edit (WRITE scope via session→lead).
  // The path :clientLeadId is authoritative for scope; we ALSO resolve the session to ensure
  // it exists and belongs to an in-scope lead before the edit runs.
  async editFields({ clientLeadId, sessionId, data, authUser }) {
    await this.#scopeBySession({ sessionId, authUser, mode: "mutate" });
    await this.legacy.editSessionFileds({ sessionId: Number(sessionId), data });
    return {};
  }

  // PUT /:clientLeadId/sessions/:sessionId/re-generate — regenerate the public token
  // (WRITE scope via session→lead).
  async regenerateToken({ sessionId, authUser }) {
    await this.#scopeBySession({ sessionId, authUser, mode: "mutate" });
    return this.legacy.regenerateSessionToken(Number(sessionId));
  }

  // DELETE /:clientLeadId/sessions/:sessionId — delete an in-progress session (WRITE scope
  // via session→lead). The legacy service applies its OWN role-based "can't delete after
  // submit" guard using the passed user — preserved by passing authUser through unchanged.
  async deleteSession({ sessionId, authUser }) {
    await this.#scopeBySession({ sessionId, authUser, mode: "mutate" });
    return this.legacy.deleteInProgressSession(Number(sessionId), authUser);
  }

  // GET /ids — global pick-list model-id helper. NOT lead-scoped (global config). Hardened:
  // the model must be in the allow-list, and the client `where` JSON is parse-guarded.
  async modelIds({ model, searchParams }) {
    if (!model || !UTILITY_MODEL_ALLOWLIST.includes(model)) {
      throw new AppError(M.IMAGE_SESSION_MODEL_NOT_ALLOWED, 400);
    }
    // Guard the client-supplied `where` JSON: the legacy service does a bare
    // JSON.parse(searchParams.where) → a malformed string would crash with a 500. Reject it
    // as a clean validation-class error here before the service runs.
    const where = searchParams?.where;
    if (where && where !== "undefined") {
      try {
        JSON.parse(where);
      } catch {
        throw new AppError(M.IMAGE_SESSION_MODEL_NOT_ALLOWED, 400);
      }
    }
    return this.legacy.getModelIds({ model, searchParams });
  }
}

export const imageSessionUsecase = new ImageSessionUsecase();
