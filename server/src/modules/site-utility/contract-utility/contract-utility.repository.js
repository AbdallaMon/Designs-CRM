// Prisma I/O ONLY. No business logic, no AppError. Methods accept an optional
// `client` so a usecase can compose them inside a prisma.$transaction.
//
// Models (server/prisma/schema.prisma — FROZEN):
//   ContractUtility                 — singleton (id Int @id @default(1));
//                                     obligationsParty{One,Two}{Ar,En} (Text).
//   ContractStageClauseTemplate     — heading/title/description Ar+En (Text), order.
//   ContractSpecialClauseTemplate   — textAr (Text), textEn (Text?), order, isActive.
//   ContractLevelClauseTemplate     — level (ContractLevel enum), textAr (Text),
//                                     textEn (Text?), order, isActive.
// All clause rows hang off ContractUtility via contractUtilityId.
import prisma from "../../../infra/prisma/prisma.js";

const CLAUSE_ORDER = { order: "asc" };

export class ContractUtilityRepository {
  // ── ContractUtility singleton ──────────────────────────────────────────────

  // The full editor payload: the singleton + its three ordered clause lists.
  // Returns null when no boilerplate has been seeded yet (legacy `dontGenerate`).
  getDetails({ client } = {}) {
    return (client ?? prisma).contractUtility.findFirst({
      include: {
        stageClauses: { orderBy: CLAUSE_ORDER },
        specialClauses: { orderBy: CLAUSE_ORDER },
        levelClauses: { orderBy: CLAUSE_ORDER },
      },
    });
  }

  getUtility({ client } = {}) {
    return (client ?? prisma).contractUtility.findFirst();
  }

  createUtility({ data, client } = {}) {
    return (client ?? prisma).contractUtility.create({ data });
  }

  updateUtility({ id, data, client } = {}) {
    return (client ?? prisma).contractUtility.update({ where: { id }, data });
  }

  // ── Stage clauses ────────────────────────────────────────────────────────────
  listStageClauses({ client } = {}) {
    return (client ?? prisma).contractStageClauseTemplate.findMany({
      orderBy: CLAUSE_ORDER,
    });
  }

  getStageClauseById({ id, client } = {}) {
    return (client ?? prisma).contractStageClauseTemplate.findUnique({
      where: { id },
    });
  }

  createStageClause({ data, client } = {}) {
    return (client ?? prisma).contractStageClauseTemplate.create({ data });
  }

  updateStageClause({ id, data, client } = {}) {
    return (client ?? prisma).contractStageClauseTemplate.update({
      where: { id },
      data,
    });
  }

  deleteStageClause({ id, client } = {}) {
    return (client ?? prisma).contractStageClauseTemplate.delete({
      where: { id },
    });
  }

  // ── Special clauses ──────────────────────────────────────────────────────────
  listSpecialClauses({ client } = {}) {
    return (client ?? prisma).contractSpecialClauseTemplate.findMany({
      orderBy: CLAUSE_ORDER,
    });
  }

  getSpecialClauseById({ id, client } = {}) {
    return (client ?? prisma).contractSpecialClauseTemplate.findUnique({
      where: { id },
    });
  }

  createSpecialClause({ data, client } = {}) {
    return (client ?? prisma).contractSpecialClauseTemplate.create({ data });
  }

  updateSpecialClause({ id, data, client } = {}) {
    return (client ?? prisma).contractSpecialClauseTemplate.update({
      where: { id },
      data,
    });
  }

  deleteSpecialClause({ id, client } = {}) {
    return (client ?? prisma).contractSpecialClauseTemplate.delete({
      where: { id },
    });
  }

  // ── Level clauses ────────────────────────────────────────────────────────────
  listLevelClauses({ client } = {}) {
    return (client ?? prisma).contractLevelClauseTemplate.findMany({
      orderBy: CLAUSE_ORDER,
    });
  }

  getLevelClauseById({ id, client } = {}) {
    return (client ?? prisma).contractLevelClauseTemplate.findUnique({
      where: { id },
    });
  }

  createLevelClause({ data, client } = {}) {
    return (client ?? prisma).contractLevelClauseTemplate.create({ data });
  }

  updateLevelClause({ id, data, client } = {}) {
    return (client ?? prisma).contractLevelClauseTemplate.update({
      where: { id },
      data,
    });
  }

  deleteLevelClause({ id, client } = {}) {
    return (client ?? prisma).contractLevelClauseTemplate.delete({
      where: { id },
    });
  }
}

export const contractUtilityRepository = new ContractUtilityRepository();
