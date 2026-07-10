// Action-audit repository — Prisma I/O ONLY (no business rules, no AppError), the
// persistence seam for the rich `ActionAuditLog` trail. Mirrors the sibling
// auth-audit.repo.js pattern (default `@dms/db` import). The trail is append-only:
// this repo exposes a `create` (called by the non-blocking recordAction service) and a
// paged read (`findManyPaged`, consumed by the /v2/audit-logs admin viewer). No update
// or delete — audit rows are immutable.
import prisma from "@dms/db";

export const actionAuditRepository = {
  // Append one audit row. `data` is the fully-built, already-redacted row from
  // recordAction (never raw request input). Returns the created row.
  create(data) {
    return prisma.actionAuditLog.create({ data });
  },

  // Paged read for the admin viewer. `where` is built by the usecase from the
  // validated filters; newest-first. Returns `{ items, total }` via a single
  // transaction so the page + count are consistent.
  async findManyPaged({ where = {}, skip = 0, take = 20 }) {
    const [items, total] = await prisma.$transaction([
      prisma.actionAuditLog.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
      }),
      prisma.actionAuditLog.count({ where }),
    ]);
    return { items, total };
  },

  // Batched actor lookup for the viewer dto (resolve actorUserId → {id,name,role}).
  // A minimal SAFE projection — never selects password/token columns.
  findUsersByIds(ids = []) {
    if (!ids.length) return Promise.resolve([]);
    return prisma.user.findMany({
      where: { id: { in: ids } },
      select: { id: true, name: true, role: true },
    });
  },
};
