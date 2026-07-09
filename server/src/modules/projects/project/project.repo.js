// projects/project repository — Prisma I/O ONLY (no business rules, no AppError).
// Read queries + the scope `where` builders are the keystone of the PROJECTS domain.
//
// ACCESS MODEL (verified against the frozen schema + legacy services):
//   - A Project belongs to a ClientLead (Project.clientLeadId) and carries
//     Assignments (Assignment.userId) — the designers/executors working it.
//   - Privileged roles (ADMIN/SUPER_ADMIN — and ACCOUNTANT for the designer detail
//     read) saw ALL projects in legacy. Everyone else was narrowed to projects they
//     are ASSIGNED to: `assignments: { some: { userId } }`. This repo translates the
//     auth user → that Prisma `where` fragment (row-level security); the usecase's
//     scope checkers run it and throw on an empty result (the IDOR fix the legacy
//     `/:id/...` routes lacked).
//
// Heavy side-effecting reads/writes (notifications, telegram, payment/stage recompute)
// stay in the not-yet-migrated services and are invoked from the usecase via lazy
// imports — the same courses/leads pattern. Simple reads live here.
import prisma from "../../../infra/prisma/prisma.js";

// Roles that historically saw EVERY project regardless of assignment. ACCOUNTANT is
// included for READ scope only (legacy `/designers/:id` allowed ACCOUNTANT to read
// without the userId narrowing); it is NOT in the mutate set.
const FULL_READ_ROLES = ["ADMIN", "SUPER_ADMIN", "ACCOUNTANT"];
const FULL_MUTATE_ROLES = ["ADMIN", "SUPER_ADMIN"];

class ProjectRepository {
  model = prisma.project;

  hasFullScope({ role, isSuperSales }, mode) {
    if (isSuperSales) return true;
    const roles = mode === "mutate" ? FULL_MUTATE_ROLES : FULL_READ_ROLES;
    return roles.includes(role);
  }

  // Translate the auth user → a Prisma `where` fragment for the Project model.
  // Full-scope users get no narrowing; everyone else is restricted to projects they
  // are assigned to. Merge the assignment filter into an AND so we never clobber a
  // caller-supplied filter.
  buildAuthUserProjectWhere({ authUser, where = {}, mode = "view" }) {
    if (this.hasFullScope(authUser, mode)) return { ...where };
    const ownership = { assignments: { some: { userId: Number(authUser.id) } } };
    const existingAnd = Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : [];
    return { ...where, AND: [...existingAnd, ownership] };
  }

  // Used by the scope checkers: load the minimal project identity under the scoped
  // `where` (existence + scope in one query — no existence leak to an unauthorized
  // caller).
  findScopedProject({ where }) {
    return prisma.project.findFirst({
      where,
      select: { id: true, clientLeadId: true, status: true, type: true, isModification: true, groupId: true },
    });
  }

  // Server-authoritative current status (used to override any client-supplied
  // oldStatus in updateProject — workflow-guard bypass fix).
  findProjectStatus({ id }) {
    return prisma.project.findUnique({
      where: { id: Number(id) },
      select: { id: true, status: true, clientLeadId: true },
    });
  }

  // Resolve a project's parent clientLead (for task/delivery scope that hands a
  // projectId and must run the project scope checker).
  findProjectClientLead({ id }) {
    return prisma.project.findUnique({
      where: { id: Number(id) },
      select: { id: true, clientLeadId: true },
    });
  }

  // Resolve a task → its parent projectId / clientLeadId (for the task scope check).
  findTaskParents({ id }) {
    return prisma.task.findUnique({
      where: { id: Number(id) },
      select: { id: true, projectId: true, clientLeadId: true, status: true, type: true },
    });
  }

  // Resolve a clientLeadUpdate → its parent clientLeadId (for the update scope check).
  findUpdateClientLead({ id }) {
    return prisma.clientLeadUpdate.findUnique({
      where: { id: Number(id) },
      select: { id: true, clientLeadId: true },
    });
  }

  // Resolve a sharedUpdate → its update → clientLeadId.
  findSharedUpdateClientLead({ id }) {
    return prisma.sharedUpdate.findUnique({
      where: { id: Number(id) },
      select: { id: true, updateId: true, update: { select: { clientLeadId: true } } },
    });
  }

  // Resolve a deliverySchedule → its parent projectId (for the delivery scope check).
  findDeliveryProject({ id }) {
    return prisma.deliverySchedule.findUnique({
      where: { id: Number(id) },
      select: { id: true, projectId: true },
    });
  }

  // Does a clientLead have ANY project assigned to this user? Used to scope-check a
  // clientLead-keyed surface (project list by lead, groups, updates, archived) for a
  // non-privileged user without leaking the lead's existence.
  async clientLeadHasAssignedProject({ clientLeadId, userId }) {
    const project = await prisma.project.findFirst({
      where: {
        clientLeadId: Number(clientLeadId),
        assignments: { some: { userId: Number(userId) } },
      },
      select: { id: true },
    });
    return Boolean(project);
  }

  // ── archived projects (legacy getArchivedProjects, ported verbatim) ──────────────
  async findArchivedLeads({ where, skip, take }) {
    const [items, total] = await Promise.all([
      prisma.clientLead.findMany({
        where,
        skip,
        take,
        include: {
          projects: {
            include: {
              assignments: {
                select: { id: true, user: { select: { id: true, name: true, email: true } } },
              },
            },
          },
        },
      }),
      prisma.clientLead.count({ where }),
    ]);
    return { items, total };
  }
}

export const projectRepository = new ProjectRepository();
export { ProjectRepository };
