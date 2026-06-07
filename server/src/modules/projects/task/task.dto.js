// projects/task DTO — per-record `capabilities.*` (FE rendering hints; server checkers
// remain the source of truth). Pure: no Prisma. A task's mutability mirrors the parent
// project scope, but list rows here don't always carry assignments — capabilities use
// the permission code + the legacy DONE lock; the route still enforces object scope.
import { computeCapabilities, hasPermission, PERMISSIONS } from "@dms/shared";

const P = PERMISSIONS;

function isAdmin(authUser) {
  return Boolean(authUser?.isSuperSales) || ["ADMIN", "SUPER_ADMIN"].includes(authUser?.role);
}

export function computeTaskCapabilities(record, authUser) {
  const permissions = authUser?.permissions ?? [];
  const admin = isAdmin(authUser);
  return computeCapabilities(
    {
      // legacy: a non-admin cannot edit a task once it is DONE.
      canEdit: () => hasPermission(permissions, P.TASK.EDIT) && (admin || record?.status !== "DONE"),
      canDelete: () => hasPermission(permissions, P.TASK.DELETE),
      canAddNote: () => hasPermission(permissions, P.TASK.NOTE_MANAGE),
    },
    {},
  );
}

export function withTaskListCapabilities(items, authUser) {
  if (!Array.isArray(items)) return items;
  return items.map((record) => ({ ...record, capabilities: computeTaskCapabilities(record, authUser) }));
}
