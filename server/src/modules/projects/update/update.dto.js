// projects/update DTO — per-record `capabilities.*` (FE rendering hints; server checkers
// remain the source of truth). Pure: no Prisma.
import { computeCapabilities, hasPermission, PERMISSIONS } from "@dms/shared";

const P = PERMISSIONS;

export function computeUpdateCapabilities(record, authUser) {
  const permissions = authUser?.permissions ?? [];
  return computeCapabilities(
    {
      canAuthorize: () => hasPermission(permissions, P.UPDATE.AUTHORIZE),
      canArchive: () => hasPermission(permissions, P.UPDATE.ARCHIVE),
      canMarkDone: () => hasPermission(permissions, P.UPDATE.MARK_DONE) && !record?.isDone,
    },
    {},
  );
}

export function withUpdateListCapabilities(items, authUser) {
  if (!Array.isArray(items)) return items;
  return items.map((record) => ({ ...record, capabilities: computeUpdateCapabilities(record, authUser) }));
}
