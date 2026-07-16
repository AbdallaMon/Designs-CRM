// projects/project DTO — output shaping + per-record `capabilities.*` (FE rendering
// hints; the server checkers remain the source of truth). Pure: no Prisma, no side
// effects.
import { computeCapabilities, hasPermission, PERMISSIONS } from "@dms/shared";
import { PROJECT_TYPES, LOCKED_FROM_STATUSES_FOR_NON_ADMIN } from "./project.constants.js";

const P = PERMISSIONS;

// ── pure project-shaping helpers (moved verbatim from legacy project-services.js) ──
// Group a flat project list into { groupId, groupTitle, projects[] } buckets, with the
// groupId===1 ("Initial Project") bucket pinned first.
export function groupProjects(projects) {
  const groupedProjects = projects.reduce((acc, project) => {
    const { groupId, groupTitle } = project;

    const existingGroup = acc.find((group) => group.groupId === groupId);

    if (existingGroup) {
      existingGroup.projects.push(project);
    } else {
      acc.push({
        groupId,
        groupTitle,
        projects: [project],
      });
    }

    return acc;
  }, []);

  groupedProjects.sort((a, b) =>
    a.groupId === 1 ? -1 : b.groupId === 1 ? 1 : a.groupId - b.groupId
  );
  return groupedProjects;
}

// Stable-sort a project list into the canonical PROJECT_TYPES order (unknown types last).
export function sortProjectsByTypeOrder(projects, order = PROJECT_TYPES) {
  const orderIndex = new Map(order.map((t, i) => [t, i]));
  const FALLBACK = order.length;
  return [...projects].sort((a, b) => {
    const ai = orderIndex.has(a.type) ? orderIndex.get(a.type) : FALLBACK;
    const bi = orderIndex.has(b.type) ? orderIndex.get(b.type) : FALLBACK;
    return ai - bi;
  });
}

function isFullScope(authUser) {
  return (
    authUser?.currentProfileKey === "SUPER_SALES" ||
    ["ADMIN", "SUPER_ADMIN"].includes(authUser?.role)
  );
}

// Whether `authUser` may mutate this project, mirroring the scope checker: admin-tier
// (ADMIN/SUPER_ADMIN/SUPER_SALES profile) may mutate any; everyone else only a project they
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

// Statuses in which an overdue deliveryTime no longer matters.
const TERMINAL_STATUSES = ["Completed", "Canceled", "Rejected"];

const toIso = (d) => (d ? new Date(d).toISOString() : null);
const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Pure, additive card metadata for a board/detail project record. Null-safe on
 * undecorated records (all fields optional). `now` is injectable for tests.
 *   nextAction: the single most urgent item — the next upcoming delivery schedule,
 *               else the first open task (repo orders tasks priority desc, updatedAt desc).
 *   overdue: Project.deliveryTime is past and the project is not terminal.
 *   timeInStageDays: whole days since statusChangedAt (fallback updatedAt, createdAt).
 *   latestActivityAt: max(project.updatedAt, first task.updatedAt) — unseen-dot source.
 */
export function computeProjectCardMeta(project, { now = new Date() } = {}) {
  if (!project) return null;

  const delivery = project.deliverySchedules?.[0]?.deliveryAt ?? null;
  const task = project.tasks?.[0] ?? null;
  let nextAction = null;
  if (delivery) {
    nextAction = { kind: "DELIVERY", title: "Delivery", dueAt: toIso(delivery) };
  } else if (task) {
    nextAction = { kind: "TASK", title: task.title ?? "Task", dueAt: toIso(task.dueDate) };
  }

  const overdue = Boolean(
    project.deliveryTime &&
      new Date(project.deliveryTime) < now &&
      !TERMINAL_STATUSES.includes(project.status),
  );

  const stageSince = project.statusChangedAt ?? project.updatedAt ?? project.createdAt ?? null;
  const timeInStageDays = stageSince
    ? Math.max(0, Math.floor((now - new Date(stageSince)) / MS_PER_DAY))
    : null;

  const candidates = [project.updatedAt, task?.updatedAt].filter(Boolean).map((d) => new Date(d));
  const latestActivityAt = candidates.length
    ? toIso(new Date(Math.max(...candidates.map((d) => d.getTime()))))
    : null;

  return { nextAction, overdue, timeInStageDays, latestActivityAt };
}

/** Attach capabilities to a list of project-shaped records. */
export function withProjectListCapabilities(items, authUser) {
  if (!Array.isArray(items)) return items;
  return items.map((record) => ({
    ...record,
    capabilities: computeProjectCapabilities(record, authUser),
    // grouped designer-board leads carry nested `projects[]`; decorate those too.
    ...(Array.isArray(record?.projects)
      ? {
          projects: record.projects.map((p) => ({
            ...p,
            capabilities: computeProjectCapabilities(p, authUser),
            cardMeta: computeProjectCardMeta(p),
          })),
        }
      : {}),
  }));
}

/**
 * Attach capabilities to a SINGLE project-shaped detail record (the designer/project
 * detail read, `getLeadDetailsByProject`, returns a lead carrying nested `projects[]`).
 * Mirrors the leads DTO's `withDetailCapabilities`, and additionally decorates the
 * nested `projects[]` the same way the board list does — so the FE can gate per-project
 * actions on the detail exactly as on the board. Null-safe; purely additive.
 */
export function withProjectDetailCapabilities(record, authUser) {
  if (!record) return record;
  return {
    ...record,
    capabilities: computeProjectCapabilities(record, authUser),
    ...(Array.isArray(record?.projects)
      ? {
          projects: record.projects.map((p) => ({
            ...p,
            capabilities: computeProjectCapabilities(p, authUser),
            cardMeta: computeProjectCardMeta(p),
          })),
        }
      : {}),
  };
}
