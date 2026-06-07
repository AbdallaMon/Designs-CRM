// utilities usecase — business logic / orchestration. Prisma NEVER appears here (only
// repo calls + a lazy legacy adapter for the cross-model search). Behavior is ported 1:1
// from the legacy handlers (routes/shared/utilities.js + routes/utility/utility.js) EXCEPT
// the two sanctioned security changes below.
//
// SECURITY (FIX 1 — user-log IDOR): legacy `submitUserLog`/`checkUserLog` took the subject
// `userId` from req.body / req.query — any authed user could forge or read another
// employee's work log (and `UserLog.@@unique([userId])` means a forged submit could even
// collide). Here the subject is ALWAYS `authUser.id` (self-scope, mirroring the
// notification fix). The client cannot select a target user. Admin-on-behalf-of is
// intentionally DROPPED from this endpoint — admin log access is owned by the users module
// (USER.VIEW_LOGS); we do NOT recreate an admin override here.
//
// SECURITY (FIX 2 — generic-model read passthrough): legacy `getImageSesssionModel` (`/`)
// and `getModelIds` (`/ids`) did `prisma[model].findMany()` while spreading client-supplied
// where/select/include — open mass-read + relation traversal + arbitrary columns. The
// usecase now (a) enforces UTILITY_MODEL_ALLOWLIST and throws MODEL_NOT_ALLOWED otherwise,
// and (b) routes the read through the repo with a FIXED server-side projection
// (UTILITY_MODEL_PROJECTIONS). The legacy builders are NO LONGER called.
import { AppError } from "../../shared/errors/AppError.js";
import {
  utilitiesMessagesCodes as C,
  UTILITY_MODEL_ALLOWLIST,
  UTILITY_MODEL_PROJECTIONS,
} from "@dms/shared";
import { utilityRepository } from "./utility.repository.js";

// Lazy adapter to the not-yet-migrated legacy cross-model search (behavior-preserving).
const legacyDefaults = {
  searchData: (body, currentUser) =>
    import("../../../services/main/utility/utility.js").then((m) => m.searchData(body, currentUser)),
};

export class UtilityUsecase {
  /**
   * @param {import("./utility.repository.js").UtilityRepository} repository
   * @param {Partial<typeof legacyDefaults>} [legacy]
   */
  constructor(repository, legacy = {}) {
    this.repo = repository;
    this.legacy = { ...legacyDefaults, ...legacy };
  }

  // Reject any model not in the allow-list (the mass-read hardening). Returns the model's
  // fixed server-side projection on success — the ONLY columns/relations the caller may
  // read for that model (FIX 2). Never trusts a client `select`/`include`.
  #resolveModelProjection(model) {
    if (!UTILITY_MODEL_ALLOWLIST.includes(model) || !UTILITY_MODEL_PROJECTIONS[model]) {
      throw new AppError(C.MODEL_NOT_ALLOWED, 400);
    }
    return UTILITY_MODEL_PROJECTIONS[model];
  }

  // ── simple lookups ──────────────────────────────────────────────────────────────
  listFixedData() {
    return this.repo.listFixedData();
  }

  // GET /user-logs — self-scoped: does a log exist for the AUTHENTICATED user in range?
  // The subject is authUser.id, NEVER a client-supplied userId (FIX 1).
  checkUserLog({ query, authUser }) {
    return this.repo.userLogExists({
      userId: authUser.id,
      startTime: query.startTime,
      endTime: query.endTime,
    });
  }

  // POST /user-logs — self-scoped: creates the AUTHENTICATED user's log. The subject is
  // authUser.id, NEVER a client-supplied userId (FIX 1).
  async submitUserLog({ body, authUser }) {
    const log = await this.repo.createUserLog({
      userId: authUser.id,
      date: body.date,
      description: body.description,
      totalMinutes: body.totalMinutes,
    });
    return log;
  }

  getUserRole({ userId }) {
    return this.repo.getUserRole({ userId });
  }

  getOtherRoles({ userId }) {
    return this.repo.getOtherRoles({ userId });
  }

  getAdmins() {
    return this.repo.getAdmins();
  }

  getImages({ query }) {
    const toIdList = (csv) =>
      csv
        ? csv
            .split(",")
            .map((id) => Number(id))
            .filter(Boolean)
        : [];
    return this.repo.listImages({
      patternIdList: toIdList(query.patternIds),
      spaceIdList: toIdList(query.spaceIds),
    });
  }

  // ── generic model reads (allow-listed + fixed projection) ──────────────────────────
  // Both `/` and `/ids` now serve the SAME safe pick-list: id + the model's label field,
  // from a server-side projection. Client where/select/include are dropped (FIX 2). The
  // allow-list denial surfaces as a rejected promise (asyncHandler → error handler).
  async getModelData({ query }) {
    const select = this.#resolveModelProjection(query.model);
    return this.repo.findModelPickList({ model: query.model, select });
  }

  async getModelIds({ query }) {
    const select = this.#resolveModelProjection(query.model);
    return this.repo.findModelPickList({ model: query.model, select });
  }

  // ── cross-model search ────────────────────────────────────────────────────────────
  // Legacy passed the decoded token (getCurrentUser) as `currentUser`; req.auth carries
  // the same role/isSuperSales fields, so we pass it directly (no extra DB hit, no cookie
  // re-decode). The legacy searchData applies its own role-derived scoping.
  search({ query, authUser }) {
    return this.legacy.searchData(query, authUser);
  }
}

export const utilityUsecase = new UtilityUsecase(utilityRepository);
