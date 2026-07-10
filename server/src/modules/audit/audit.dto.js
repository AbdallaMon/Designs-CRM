// audit DTO — output shaping only (pure, no Prisma). Shapes each ActionAuditLog row for
// the admin viewer: resolves the actor to { id, name, role } via a batched user map built
// in the usecase, and exposes the already-redacted `detail` verbatim. NEVER leaks secrets
// (redaction happens at WRITE time in recordAction/diffFields) or internal columns.
export class AuditDto {
  // Shape one row. `usersById` maps actorUserId → { id, name, role } (batched lookup).
  static toItem(row, usersById = new Map()) {
    const user = usersById.get(row.actorUserId) || null;
    return {
      id: row.id,
      createdAt: row.createdAt,
      actor: {
        id: row.actorUserId,
        name: user?.name ?? null,
        // Prefer the role snapshot captured at action time; fall back to the
        // actor's current role.
        role: row.actorRole ?? user?.role ?? null,
      },
      module: row.module,
      action: row.action,
      entityType: row.entityType,
      entityId: row.entityId,
      clientLeadId: row.clientLeadId,
      summary: row.summary,
      detail: row.detail ?? null,
    };
  }

  static toPaginatedList({ items, total, page, pageSize, usersById }) {
    return {
      items: items.map((row) => AuditDto.toItem(row, usersById)),
      total,
      page,
      pageSize,
    };
  }
}
