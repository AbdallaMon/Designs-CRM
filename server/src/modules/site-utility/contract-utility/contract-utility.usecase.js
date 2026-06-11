import { AppError } from "../../../shared/errors/AppError.js";
import { PERMISSIONS, siteUtilityMessagesCodes } from "@dms/shared";
import { contractUtilityRepository } from "./contract-utility.repository.js";
import { toContractUtilityDetailsDto } from "./contract-utility.dto.js";

const P = PERMISSIONS.SITE_UTILITY;
const M = siteUtilityMessagesCodes;

// Business logic / orchestration for the contract-utility editor. Prisma never
// appears here — only repo calls. Errors are thrown as AppError(code, statusCode);
// success values are returned.
//
// The clause templates hang off the ContractUtility singleton (contractUtilityId).
// Legacy resolved the singleton via `findFirst` before every clause create and
// assigned its id; if no singleton existed it crashed on `.id` of null. We preserve
// the observable create behavior but fail cleanly (CONTRACT_UTILITY_NOT_FOUND, 409)
// instead of throwing a raw TypeError — the obligations save creates the singleton.
export class ContractUtilityUsecase {
  /** @param {import("./contract-utility.repository.js").ContractUtilityRepository} repository */
  constructor(repository) {
    this.repository = repository;
  }

  // ── Aggregate read ───────────────────────────────────────────────────────────
  // GET /details — the singleton + its three ordered clause lists. Mirrors legacy
  // `getContractUtilityData()` (dontGenerate: true): returns null/empties when no
  // boilerplate has been seeded rather than auto-generating defaults.
  async getDetails({ authUser } = {}) {
    const utility = await this.repository.getDetails();
    const canEdit = (authUser?.permissions || []).includes(P.CONTRACT_UTILITY_EDIT);
    return toContractUtilityDetailsDto(utility, { canEdit });
  }

  // ── Obligations (ContractUtility singleton) ──────────────────────────────────
  // GET /obligations — the singleton row (or null).
  async getObligations() {
    return this.repository.getUtility();
  }

  // POST|PUT /obligations — upsert, matching legacy `updateContractUtilityData`:
  // create the singleton if missing, otherwise update it. Returns the persisted row.
  async saveObligations({ input }) {
    const existing = await this.repository.getUtility();
    if (!existing) {
      return this.repository.createUtility({ data: input });
    }
    return this.repository.updateUtility({ id: existing.id, data: input });
  }

  // Resolve the singleton id for a clause create; fail cleanly if not seeded yet.
  async #requireUtilityId() {
    const utility = await this.repository.getUtility();
    if (!utility) {
      throw new AppError(M.CONTRACT_UTILITY_NOT_FOUND, 409);
    }
    return utility.id;
  }

  // ── Stage clauses ────────────────────────────────────────────────────────────
  async listStageClauses() {
    return this.repository.listStageClauses();
  }

  async createStageClause({ input }) {
    const contractUtilityId = await this.#requireUtilityId();
    return this.repository.createStageClause({
      data: { ...input, contractUtilityId },
    });
  }

  async updateStageClause({ id, input }) {
    const existing = await this.repository.getStageClauseById({ id });
    if (!existing) throw new AppError(M.CLAUSE_NOT_FOUND, 404);
    return this.repository.updateStageClause({ id, data: input });
  }

  async deleteStageClause({ id }) {
    const existing = await this.repository.getStageClauseById({ id });
    if (!existing) throw new AppError(M.CLAUSE_NOT_FOUND, 404);
    await this.repository.deleteStageClause({ id });
    return { id };
  }

  // ── Special clauses ──────────────────────────────────────────────────────────
  async listSpecialClauses() {
    return this.repository.listSpecialClauses();
  }

  async createSpecialClause({ input }) {
    const contractUtilityId = await this.#requireUtilityId();
    return this.repository.createSpecialClause({
      data: { ...input, contractUtilityId },
    });
  }

  async updateSpecialClause({ id, input }) {
    const existing = await this.repository.getSpecialClauseById({ id });
    if (!existing) throw new AppError(M.CLAUSE_NOT_FOUND, 404);
    return this.repository.updateSpecialClause({ id, data: input });
  }

  async deleteSpecialClause({ id }) {
    const existing = await this.repository.getSpecialClauseById({ id });
    if (!existing) throw new AppError(M.CLAUSE_NOT_FOUND, 404);
    await this.repository.deleteSpecialClause({ id });
    return { id };
  }

  // ── Level clauses ────────────────────────────────────────────────────────────
  async listLevelClauses() {
    return this.repository.listLevelClauses();
  }

  async createLevelClause({ input }) {
    const contractUtilityId = await this.#requireUtilityId();
    return this.repository.createLevelClause({
      data: { ...input, contractUtilityId },
    });
  }

  async updateLevelClause({ id, input }) {
    const existing = await this.repository.getLevelClauseById({ id });
    if (!existing) throw new AppError(M.CLAUSE_NOT_FOUND, 404);
    return this.repository.updateLevelClause({ id, data: input });
  }

  async deleteLevelClause({ id }) {
    const existing = await this.repository.getLevelClauseById({ id });
    if (!existing) throw new AppError(M.CLAUSE_NOT_FOUND, 404);
    await this.repository.deleteLevelClause({ id });
    return { id };
  }
}

export const contractUtilityUsecase = new ContractUtilityUsecase(
  contractUtilityRepository,
);
