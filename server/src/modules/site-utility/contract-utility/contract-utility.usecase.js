import { AppError } from "../../../shared/errors/AppError.js";
import { PERMISSIONS, siteUtilityMessagesCodes } from "@dms/shared";
import { contractUtilityRepository } from "./contract-utility.repo.js";
import { toContractUtilityDetailsDto } from "./contract-utility.dto.js";

const P = PERMISSIONS.SITE_UTILITY;

// ContractUtility is a singleton whose PK is `id Int @id` (schema.prisma) with NO
// DB-side default (not autoincrement — verified against the reconciled prod schema).
// The row is seeded lazily on the first obligations save, so the create must supply
// an explicit id or Prisma rejects it ("Argument `id` is missing"). We use a fixed
// singleton id, mirroring the sibling SiteUtility singleton (`id Int @id @default(1)`).
const CONTRACT_UTILITY_SINGLETON_ID = 1;

// Business logic / orchestration for the contract-utility editor. Prisma never
// appears here — only repo calls. Errors are thrown as AppError(code, statusCode);
// success values are returned.
//
// The clause templates hang off the ContractUtility singleton (contractUtilityId).
// Legacy resolved the singleton via `findFirst` before every clause create and
// assigned its id; if no singleton existed it crashed on `.id` of null. We preserve
// the observable create behavior but fail cleanly (CONTRACT_UTILITY_NOT_FOUND, 409)
// instead of throwing a raw TypeError — the obligations save creates the singleton.
class ContractUtilityUsecase {
  // ── Aggregate read ───────────────────────────────────────────────────────────
  // GET /details — the singleton + its three ordered clause lists. Mirrors legacy
  // `getContractUtilityData()` (dontGenerate: true): returns null/empties when no
  // boilerplate has been seeded rather than auto-generating defaults.
  async getContractUtilityDetails({ authUser } = {}) {
    const utility = await contractUtilityRepository.getDetails();
    const canEdit = (authUser?.permissions || []).includes(P.CONTRACT_UTILITY_EDIT);
    return toContractUtilityDetailsDto(utility, { canEdit });
  }

  // ── Obligations (ContractUtility singleton) ──────────────────────────────────
  // GET /obligations — the singleton row (or null).
  async getObligations() {
    return contractUtilityRepository.getUtility();
  }

  // POST|PUT /obligations — upsert, matching legacy `updateContractUtilityData`:
  // create the singleton if missing, otherwise update it. Returns the persisted row.
  async saveObligations({ input }) {
    const existing = await contractUtilityRepository.getUtility();
    if (!existing) {
      return contractUtilityRepository.createUtility({
        data: { ...input, id: CONTRACT_UTILITY_SINGLETON_ID },
      });
    }
    return contractUtilityRepository.updateUtility({ id: existing.id, data: input });
  }

  // Resolve the singleton id for a clause create; fail cleanly if not seeded yet.
  async #requireUtilityId() {
    const utility = await contractUtilityRepository.getUtility();
    if (!utility) {
      throw new AppError({ code: siteUtilityMessagesCodes.CONTRACT_UTILITY_NOT_FOUND, statusCode: 409 });
    }
    return utility.id;
  }

  // ── Stage clauses ────────────────────────────────────────────────────────────
  async listStageClauses() {
    return contractUtilityRepository.listStageClauses();
  }

  async createStageClause({ input }) {
    const contractUtilityId = await this.#requireUtilityId();
    return contractUtilityRepository.createStageClause({
      data: { ...input, contractUtilityId },
    });
  }

  async updateStageClause({ id, input }) {
    const existing = await contractUtilityRepository.getStageClauseById({ id });
    if (!existing) throw new AppError({ code: siteUtilityMessagesCodes.CLAUSE_NOT_FOUND, statusCode: 404 });
    return contractUtilityRepository.updateStageClause({ id, data: input });
  }

  async deleteStageClause({ id }) {
    const existing = await contractUtilityRepository.getStageClauseById({ id });
    if (!existing) throw new AppError({ code: siteUtilityMessagesCodes.CLAUSE_NOT_FOUND, statusCode: 404 });
    await contractUtilityRepository.deleteStageClause({ id });
    return { id };
  }

  // ── Special clauses ──────────────────────────────────────────────────────────
  async listSpecialClauses() {
    return contractUtilityRepository.listSpecialClauses();
  }

  async createSpecialClause({ input }) {
    const contractUtilityId = await this.#requireUtilityId();
    return contractUtilityRepository.createSpecialClause({
      data: { ...input, contractUtilityId },
    });
  }

  async updateSpecialClause({ id, input }) {
    const existing = await contractUtilityRepository.getSpecialClauseById({ id });
    if (!existing) throw new AppError({ code: siteUtilityMessagesCodes.CLAUSE_NOT_FOUND, statusCode: 404 });
    return contractUtilityRepository.updateSpecialClause({ id, data: input });
  }

  async deleteSpecialClause({ id }) {
    const existing = await contractUtilityRepository.getSpecialClauseById({ id });
    if (!existing) throw new AppError({ code: siteUtilityMessagesCodes.CLAUSE_NOT_FOUND, statusCode: 404 });
    await contractUtilityRepository.deleteSpecialClause({ id });
    return { id };
  }

  // ── Level clauses ────────────────────────────────────────────────────────────
  async listLevelClauses() {
    return contractUtilityRepository.listLevelClauses();
  }

  async createLevelClause({ input }) {
    const contractUtilityId = await this.#requireUtilityId();
    return contractUtilityRepository.createLevelClause({
      data: { ...input, contractUtilityId },
    });
  }

  async updateLevelClause({ id, input }) {
    const existing = await contractUtilityRepository.getLevelClauseById({ id });
    if (!existing) throw new AppError({ code: siteUtilityMessagesCodes.CLAUSE_NOT_FOUND, statusCode: 404 });
    return contractUtilityRepository.updateLevelClause({ id, data: input });
  }

  async deleteLevelClause({ id }) {
    const existing = await contractUtilityRepository.getLevelClauseById({ id });
    if (!existing) throw new AppError({ code: siteUtilityMessagesCodes.CLAUSE_NOT_FOUND, statusCode: 404 });
    await contractUtilityRepository.deleteLevelClause({ id });
    return { id };
  }
}

export const contractUtilityUsecase = new ContractUtilityUsecase();
export { ContractUtilityUsecase };
