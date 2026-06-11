import { ok, created, deleted } from "../../../shared/http/response.js";
import { siteUtilityMessagesCodes, messagesNames } from "@dms/shared";
import { contractUtilityUsecase } from "./contract-utility.usecase.js";

const TK = messagesNames.siteUtilityMessages;
const M = siteUtilityMessagesCodes;

// Thin controller: read validated input, call the usecase, respond via helpers.
// No business rules here (primitive coercion only).
export class ContractUtilityController {
  /** @param {import("./contract-utility.usecase.js").ContractUtilityUsecase} usecase */
  constructor(usecase) {
    this.usecase = usecase;
  }

  // ── Aggregate read ───────────────────────────────────────────────────────────
  getDetails = async (req, res) => {
    const data = await this.usecase.getDetails({ authUser: req.auth });
    return ok(res, data, M.CONTRACT_UTILITY_FETCHED, TK);
  };

  // ── Obligations ──────────────────────────────────────────────────────────────
  getObligations = async (req, res) => {
    const data = await this.usecase.getObligations();
    return ok(res, data, M.OBLIGATIONS_FETCHED, TK);
  };

  saveObligations = async (req, res) => {
    const data = await this.usecase.saveObligations({ input: req.body });
    return ok(res, data, M.OBLIGATIONS_SAVED, TK);
  };

  // ── Stage clauses ────────────────────────────────────────────────────────────
  listStageClauses = async (req, res) => {
    const data = await this.usecase.listStageClauses();
    return ok(res, data, M.STAGE_CLAUSES_FETCHED, TK);
  };

  createStageClause = async (req, res) => {
    const data = await this.usecase.createStageClause({ input: req.body });
    return created(res, data, M.STAGE_CLAUSE_CREATED, TK);
  };

  updateStageClause = async (req, res) => {
    const data = await this.usecase.updateStageClause({
      id: Number(req.params.clauseId),
      input: req.body,
    });
    return ok(res, data, M.STAGE_CLAUSE_UPDATED, TK);
  };

  deleteStageClause = async (req, res) => {
    await this.usecase.deleteStageClause({ id: Number(req.params.clauseId) });
    return deleted(res, M.STAGE_CLAUSE_DELETED, TK);
  };

  // ── Special clauses ──────────────────────────────────────────────────────────
  listSpecialClauses = async (req, res) => {
    const data = await this.usecase.listSpecialClauses();
    return ok(res, data, M.SPECIAL_CLAUSES_FETCHED, TK);
  };

  createSpecialClause = async (req, res) => {
    const data = await this.usecase.createSpecialClause({ input: req.body });
    return created(res, data, M.SPECIAL_CLAUSE_CREATED, TK);
  };

  updateSpecialClause = async (req, res) => {
    const data = await this.usecase.updateSpecialClause({
      id: Number(req.params.clauseId),
      input: req.body,
    });
    return ok(res, data, M.SPECIAL_CLAUSE_UPDATED, TK);
  };

  deleteSpecialClause = async (req, res) => {
    await this.usecase.deleteSpecialClause({ id: Number(req.params.clauseId) });
    return deleted(res, M.SPECIAL_CLAUSE_DELETED, TK);
  };

  // ── Level clauses ────────────────────────────────────────────────────────────
  listLevelClauses = async (req, res) => {
    const data = await this.usecase.listLevelClauses();
    return ok(res, data, M.LEVEL_CLAUSES_FETCHED, TK);
  };

  createLevelClause = async (req, res) => {
    const data = await this.usecase.createLevelClause({ input: req.body });
    return created(res, data, M.LEVEL_CLAUSE_CREATED, TK);
  };

  updateLevelClause = async (req, res) => {
    const data = await this.usecase.updateLevelClause({
      id: Number(req.params.clauseId),
      input: req.body,
    });
    return ok(res, data, M.LEVEL_CLAUSE_UPDATED, TK);
  };

  deleteLevelClause = async (req, res) => {
    await this.usecase.deleteLevelClause({ id: Number(req.params.clauseId) });
    return deleted(res, M.LEVEL_CLAUSE_DELETED, TK);
  };
}

export const contractUtilityController = new ContractUtilityController(
  contractUtilityUsecase,
);
