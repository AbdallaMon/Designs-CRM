import { ok, created, deleted } from "../../../shared/http/response.js";
import { siteUtilityMessagesCodes, messagesNames } from "@dms/shared";
import { contractUtilityUsecase } from "./contract-utility.usecase.js";

const TK = messagesNames.siteUtilityMessages;

// Thin controller: read validated input, call the usecase, respond via helpers.
// No business rules here (primitive coercion only).
class ContractUtilityController {
  // ── Aggregate read ───────────────────────────────────────────────────────────
  async getContractUtilityDetails(req, res) {
    const data = await contractUtilityUsecase.getContractUtilityDetails({ authUser: req.auth });
    return ok(res, data, siteUtilityMessagesCodes.CONTRACT_UTILITY_FETCHED, TK);
  }

  // ── Obligations ──────────────────────────────────────────────────────────────
  async getObligations(req, res) {
    const data = await contractUtilityUsecase.getObligations();
    return ok(res, data, siteUtilityMessagesCodes.OBLIGATIONS_FETCHED, TK);
  }

  async saveObligations(req, res) {
    const data = await contractUtilityUsecase.saveObligations({ input: req.body });
    return ok(res, data, siteUtilityMessagesCodes.OBLIGATIONS_SAVED, TK);
  }

  // ── Stage clauses ────────────────────────────────────────────────────────────
  async listStageClauses(req, res) {
    const data = await contractUtilityUsecase.listStageClauses();
    return ok(res, data, siteUtilityMessagesCodes.STAGE_CLAUSES_FETCHED, TK);
  }

  async createStageClause(req, res) {
    const data = await contractUtilityUsecase.createStageClause({ input: req.body });
    return created(res, data, siteUtilityMessagesCodes.STAGE_CLAUSE_CREATED, TK);
  }

  async updateStageClause(req, res) {
    const data = await contractUtilityUsecase.updateStageClause({
      id: Number(req.params.clauseId),
      input: req.body,
    });
    return ok(res, data, siteUtilityMessagesCodes.STAGE_CLAUSE_UPDATED, TK);
  }

  async deleteStageClause(req, res) {
    await contractUtilityUsecase.deleteStageClause({ id: Number(req.params.clauseId) });
    return deleted(res, siteUtilityMessagesCodes.STAGE_CLAUSE_DELETED, TK);
  }

  // ── Special clauses ──────────────────────────────────────────────────────────
  async listSpecialClauses(req, res) {
    const data = await contractUtilityUsecase.listSpecialClauses();
    return ok(res, data, siteUtilityMessagesCodes.SPECIAL_CLAUSES_FETCHED, TK);
  }

  async createSpecialClause(req, res) {
    const data = await contractUtilityUsecase.createSpecialClause({ input: req.body });
    return created(res, data, siteUtilityMessagesCodes.SPECIAL_CLAUSE_CREATED, TK);
  }

  async updateSpecialClause(req, res) {
    const data = await contractUtilityUsecase.updateSpecialClause({
      id: Number(req.params.clauseId),
      input: req.body,
    });
    return ok(res, data, siteUtilityMessagesCodes.SPECIAL_CLAUSE_UPDATED, TK);
  }

  async deleteSpecialClause(req, res) {
    await contractUtilityUsecase.deleteSpecialClause({ id: Number(req.params.clauseId) });
    return deleted(res, siteUtilityMessagesCodes.SPECIAL_CLAUSE_DELETED, TK);
  }

  // ── Level clauses ────────────────────────────────────────────────────────────
  async listLevelClauses(req, res) {
    const data = await contractUtilityUsecase.listLevelClauses();
    return ok(res, data, siteUtilityMessagesCodes.LEVEL_CLAUSES_FETCHED, TK);
  }

  async createLevelClause(req, res) {
    const data = await contractUtilityUsecase.createLevelClause({ input: req.body });
    return created(res, data, siteUtilityMessagesCodes.LEVEL_CLAUSE_CREATED, TK);
  }

  async updateLevelClause(req, res) {
    const data = await contractUtilityUsecase.updateLevelClause({
      id: Number(req.params.clauseId),
      input: req.body,
    });
    return ok(res, data, siteUtilityMessagesCodes.LEVEL_CLAUSE_UPDATED, TK);
  }

  async deleteLevelClause(req, res) {
    await contractUtilityUsecase.deleteLevelClause({ id: Number(req.params.clauseId) });
    return deleted(res, siteUtilityMessagesCodes.LEVEL_CLAUSE_DELETED, TK);
  }
}

export const contractUtilityController = new ContractUtilityController();
export { ContractUtilityController };
