// audit usecase — business logic / orchestration for the admin viewer. Prisma NEVER
// appears here (only repo calls). Builds the Prisma `where` from the validated filters,
// pages via the repo, resolves actor names through a BATCHED user lookup, and maps rows
// through the dto. Read-only — no writes (the trail is append-only from usecases via
// recordAction). Authorization (the `audit.log.view` code) is enforced at the route;
// this surface is ADMIN/SUPER_ADMIN only, and every row is global (no per-record owner),
// so there is no additional object-scope to check.
import { auditRepo } from "./audit.repo.js";
import { AuditDto } from "./audit.dto.js";

export class AuditUsecase {
  /**
   * @param {typeof import("./audit.repo.js").auditRepo} repository
   */
  constructor(repository) {
    this.repo = repository;
  }

  // Build the Prisma where from the (already validated + coerced) query filters. Only
  // the known filter keys are consumed; anything else in the query is ignored.
  #buildWhere(query) {
    const where = {};
    if (query.actorUserId != null) where.actorUserId = query.actorUserId;
    if (query.module) where.module = query.module;
    if (query.action) where.action = query.action;
    if (query.entityType) where.entityType = query.entityType;
    if (query.entityId != null) where.entityId = query.entityId;
    if (query.clientLeadId != null) where.clientLeadId = query.clientLeadId;
    if (query.from || query.to) {
      where.createdAt = {};
      if (query.from) where.createdAt.gte = query.from;
      if (query.to) where.createdAt.lte = query.to;
    }
    return where;
  }

  async list({ query }) {
    // INPUT param is `limit`; the OUTPUT envelope still exposes it as `pageSize`.
    // Defensive clamp — page is a positive int (min 1) even if the validator is bypassed.
    const page = Math.max(1, Number(query.page) || 1);
    const pageSize = Number(query.limit) || 20;
    const skip = (page - 1) * pageSize;

    const where = this.#buildWhere(query);
    const { items, total } = await this.repo.findManyPaged({ where, skip, take: pageSize });

    // Batched actor resolution — one query for all distinct actor ids on the page.
    const actorIds = [...new Set(items.map((r) => r.actorUserId).filter((id) => id != null))];
    const users = await this.repo.findUsersByIds(actorIds);
    const usersById = new Map(users.map((u) => [u.id, u]));

    return AuditDto.toPaginatedList({ items, total, page, pageSize, usersById });
  }
}

export const auditUsecase = new AuditUsecase(auditRepo);
