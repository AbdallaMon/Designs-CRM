// projects/project DTO — output shaping + per-record `capabilities.*` (FE rendering
// hints; the server checkers remain the source of truth). Pure: no Prisma, no side
// effects.
import { computeCapabilities, hasPermission, PERMISSIONS } from "@dms/shared";

const P = PERMISSIONS;

// Project board statuses a NON-admin user cannot transition AWAY from (legacy
// updateProject rule). Used only to derive `canEditStatus` for the UI; the route still
// enforces.
const LOCKED_FROM_STATUSES_FOR_NON_ADMIN = ["Completed", "Canceled", "Rejected"];

function isFullScope(authUser) {
  return (
    Boolean(authUser?.isSuperSales) ||
    ["ADMIN", "SUPER_ADMIN"].includes(authUser?.role)
  );
}

// Whether `authUser` may mutate this project, mirroring the scope checker: admin-tier
// (ADMIN/SUPER_ADMIN/isSuperSales) may mutate any; everyone else only a project they
// are assigned to. `record.assignments` may carry `{ user: { id } }` or `{ userId }`.
function canMutateProject({ record, authUser }) {
  if (isFullScope(authUser)) return true;
  const uid = Number(authUser?.id);
  const assignments = record?.assignments ?? [];
  return assignments.some(
    (a) => Number(a?.userId ?? a?.user?.id) === uid,
  );
}

/** Capabilities for a single project record (list row or detail). */
export function computeProjectCapabilities(record, authUser) {
  const permissions = authUser?.permissions ?? [];
  const mutable = canMutateProject({ record, authUser });
  const admin = isFullScope(authUser);
  return computeCapabilities(
    {
      canEdit: () => hasPermission(permissions, P.PROJECT.EDIT) && mutable,
      canEditStatus: () =>
        hasPermission(permissions, P.PROJECT.EDIT) &&
        mutable &&
        (admin || !LOCKED_FROM_STATUSES_FOR_NON_ADMIN.includes(record?.status)),
      canAssignDesigner: () => hasPermission(permissions, P.PROJECT.MANAGE),
      canChangeStatus: () => hasPermission(permissions, P.PROJECT.MANAGE),
      canAddTask: () => hasPermission(permissions, P.TASK.CREATE) && mutable,
      canAddDelivery: () => hasPermission(permissions, P.DELIVERY.CREATE) && mutable,
    },
    {},
  );
}

/** Attach capabilities to a list of project-shaped records. */
export function withProjectListCapabilities(items, authUser) {
  if (!Array.isArray(items)) return items;
  return items.map((record) => ({
    ...record,
    capabilities: computeProjectCapabilities(record, authUser),
    // grouped designer-board leads carry nested `projects[]`; decorate those too.
    ...(Array.isArray(record?.projects)
      ? { projects: record.projects.map((p) => ({ ...p, capabilities: computeProjectCapabilities(p, authUser) })) }
      : {}),
  }));
}
