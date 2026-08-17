import { TASK_STATUSES, PROJECT_STATUSES, PROFILES } from "@dms/shared";
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
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";

dayjs.extend(utc);
dayjs.extend(timezone);

// Pure date-window helper (moved verbatim from legacy project-services.js). Used only to
// build the deliverySchedule `deliveryAt` filter in the project reads below.
function todayRange() {
  const currentTime = dayjs();
  const offsetMinutes = currentTime.utcOffset();
  const offsetHours = offsetMinutes / 60;

  let s = dayjs().startOf("day");
  if (offsetHours < 0) {
    s = s.subtract(offsetHours, "hour");
  }
  if (offsetHours > 0) {
    s = s.add(offsetHours, "hour");
  }
  const start = s.add(8, "hour").toDate();
  const end = dayjs().endOf("day").toDate();
  const now = dayjs(start).add(1, "minute").toDate();

  return { now, start, end };
}

// Roles that historically saw EVERY project regardless of assignment. ACCOUNTANT is
// included for READ scope only (legacy `/designers/:id` allowed ACCOUNTANT to read
// without the userId narrowing); it is NOT in the mutate set.
class ProjectRepository {
  model = prisma.project;

  hasFullScope({ currentProfileKey, isAdminTier }, mode) {
    if (currentProfileKey === PROFILES.SUPER_SALES || isAdminTier) return true;
    return mode !== "mutate" && currentProfileKey === PROFILES.ACCOUNTANT;
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

  // ════════════════════════════════════════════════════════════════════════════
  //  Ported Prisma I/O from legacy project-services.js (query objects verbatim)
  // ════════════════════════════════════════════════════════════════════════════
  // legacy getProjects
  findProjectsWithSchedules({ clientLeadId }) {
    const { now } = todayRange();
    const meetingOrNot = {
      OR: [
        { meeting: { is: { status: { in: [PROJECT_STATUSES.IN_PROGRESS] } } } },
        { meeting: null },
        { meetingReminderId: null },
      ],
    };
    return prisma.project.findMany({
      where: {
        clientLeadId: Number(clientLeadId),
      },
      include: {
        deliverySchedules: {
          where: {
            ...meetingOrNot,
            deliveryAt: { gte: now },
          },
          orderBy: { deliveryAt: "asc" },
          take: 1,
        },
        assignments: {
          select: {
            id: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });
  }

  // legacy createProjects — highest existing groupId
  findHighestGroup({ clientLeadId }) {
    return prisma.project.findFirst({
      where: {
        clientLeadId: Number(clientLeadId),
      },
      orderBy: {
        groupId: "desc",
      },
      select: {
        groupId: true,
      },
    });
  }

  createManyProjects({ data }) {
    return prisma.project.createMany({ data });
  }

  // legacy getProjectsByClientLeadId / getUniqueProjectGroups — group-1 presence probe
  findGroupOneInitialProject({ clientLeadId }) {
    return prisma.project.findFirst({
      where: {
        groupId: 1,
        clientLeadId: Number(clientLeadId),
        groupTitle: "Initial Project",
      },
    });
  }

  // legacy createGroupProjects — duplicate-title probe
  findProjectByIdAndTitle({ id, title }) {
    return prisma.project.findFirst({
      where: {
        id: Number(id),
        groupTitle: title,
      },
    });
  }

  // ── assignProjectToUser Prisma pieces ────────────────────────────────────────────
  findAssignment({ userId, projectId }) {
    return prisma.assignment.findFirst({
      where: {
        userId: Number(userId),
        projectId: Number(projectId),
      },
    });
  }

  findClientLeadIdByProject({ projectId }) {
    return prisma.clientLead.findFirst({
      where: {
        projects: {
          some: {
            id: Number(projectId),
          },
        },
      },
      select: {
        id: true,
      },
    });
  }

  findModificationProject({ clientLeadId, groupId }) {
    return prisma.project.findFirst({
      where: {
        clientLeadId: Number(clientLeadId),
        type: "3D_Modification",
        groupId: Number(groupId),
      },
      select: {
        id: true,
        assignments: {
          select: {
            id: true,
          },
        },
      },
    });
  }

  findAssignmentById({ assignmentId }) {
    return prisma.assignment.findUnique({
      where: {
        id: Number(assignmentId),
      },
    });
  }

  deleteAssignmentById({ id }) {
    return prisma.assignment.delete({
      where: {
        id: Number(id),
      },
    });
  }

  findAssignmentByProjectUser({ projectId, userId }) {
    return prisma.assignment.findFirst({
      where: {
        projectId,
        userId,
      },
    });
  }

  createAssignment({ userId, projectId }) {
    return prisma.assignment.create({
      data: {
        userId: Number(userId),
        projectId: Number(projectId),
      },
    });
  }

  findProjectWithAssignments({ projectId }) {
    return prisma.project.findUnique({
      where: { id: Number(projectId) },
      include: {
        assignments: {
          select: {
            id: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });
  }

  findUserById({ userId }) {
    return prisma.user.findUnique({
      where: {
        id: Number(userId),
      },
    });
  }

  // ── updateProject Prisma pieces ──────────────────────────────────────────────────
  findProjectDeliveryStatus({ id }) {
    return prisma.project.findUnique({
      where: { id: Number(id) },
      select: { deliveryTime: true, status: true },
    });
  }

  updateProjectById({ id, data }) {
    return prisma.project.update({
      where: { id: Number(id) },
      data,
    });
  }

  updateManyModification({ groupId, clientLeadId }) {
    return prisma.project.updateMany({
      where: {
        groupId,
        clientLeadId,
        type: "3D_Modification",
      },
      data: {
        isModification: true,
      },
    });
  }

  setProjectStarted({ id }) {
    return prisma.project.update({
      where: {
        id: Number(id),
      },
      data: {
        startedAt: new Date(),
      },
    });
  }

  setProjectEnded({ id }) {
    return prisma.project.update({
      where: {
        id: Number(id),
      },
      data: {
        endedAt: new Date(),
      },
    });
  }

  // ── getUserProjects ──────────────────────────────────────────────────────────────
  findUserProjects({ where, take, skip }) {
    return prisma.project.findMany({
      where,
      take,
      skip,
      include: {
        clientLead: {
          include: {
            client: true,
          },
        },
        tasks: true,
        assignments: {
          select: {
            id: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  countProjects({ where }) {
    return prisma.project.count({ where });
  }

  // ── getProjectDetailsById ────────────────────────────────────────────────────────
  findProjectDetail({ where }) {
    return prisma.project.findUnique({
      where,
      include: {
        clientLead: {
          select: {
            id: true,
          },
        },
        assignments: {
          select: {
            id: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        tasks: true,
      },
    });
  }

  // ── getLeadByPorjects ────────────────────────────────────────────────────────────
  findLeadByProjects({ where, projectWhere, updatesWhere, sharedUpdatesWhere, taskFilter }) {
    return prisma.clientLead.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        client: { select: { name: true } },
        projects: {
          where: projectWhere,
          select: {
            id: true,
            type: true,
            status: true,
            area: true,
            deliveryTime: true,
            priority: true,
            startedAt: true,
            endedAt: true,
            clientLeadId: true,
            isModification: true,
            groupTitle: true,
            groupId: true,
            statusChangedAt: true,
            updatedAt: true,
            createdAt: true,
            assignments: {
              select: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            },
            tasks: {
              where: {
                ...taskFilter,
                status: {
                  in: [TASK_STATUSES.TODO, PROJECT_STATUSES.IN_PROGRESS],
                },
              },
              select: {
                id: true,
                title: true,
                description: true,
                status: true,
                priority: true,
                type: true,
                createdAt: true,
                updatedAt: true,
                dueDate: true,
                finishedAt: true,
                userId: true,
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
              orderBy: [
                {
                  priority: "desc",
                },
                {
                  updatedAt: "desc",
                },
              ],
            },
          },
        },
        status: true,
        telegramLink: true,
        price: true,
        averagePrice: true,
        priceWithOutDiscount: true,
        selectedCategory: true,
        description: true,
        type: true,
        emirate: true,
        discount: true,
        updates: {
          orderBy: { updatedAt: "desc" },
          where: updatesWhere,
          take: 6,
          include: {
            sharedSettings: {
              where: sharedUpdatesWhere,
            },
          },
        },
      },
    });
  }

  // ── getLeadByPorjectsColumn (findMany + aggregates) ──────────────────────────────
  findLeadByProjectsColumn({ where, projectWhere, updatesWhere, sharedUpdatesWhere, taskFilter, skip, take }) {
    const { now } = todayRange();
    const meetingOrNot = {
      OR: [
        { meeting: { is: { status: { in: [PROJECT_STATUSES.IN_PROGRESS] } } } },
        { meeting: null },
        { meetingReminderId: null },
      ],
    };
    return prisma.clientLead.findMany({
      where,
      skip: Number(skip) || 0,
      take: Number(take) || 20,
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        client: { select: { name: true } },
        projects: {
          where: projectWhere,
          select: {
            id: true,
            type: true,
            status: true,
            area: true,
            deliveryTime: true,
            priority: true,
            startedAt: true,
            endedAt: true,
            clientLeadId: true,
            isModification: true,
            groupTitle: true,
            groupId: true,
            statusChangedAt: true,
            updatedAt: true,
            createdAt: true,
            deliverySchedules: {
              where: {
                ...meetingOrNot,
                deliveryAt: { gte: now },
              },
              orderBy: { deliveryAt: "asc" },

              take: 1,
            },
            assignments: {
              select: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            },
            tasks: {
              where: {
                ...taskFilter,
                status: {
                  in: [TASK_STATUSES.TODO, PROJECT_STATUSES.IN_PROGRESS],
                },
              },
              select: {
                id: true,
                title: true,
                description: true,
                status: true,
                priority: true,
                type: true,
                createdAt: true,
                updatedAt: true,
                dueDate: true,
                finishedAt: true,
                userId: true,
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
              orderBy: [
                {
                  priority: "desc",
                },
                {
                  updatedAt: "desc",
                },
              ],
            },
          },
        },
        status: true,
        telegramLink: true,
        price: true,
        averagePrice: true,
        priceWithOutDiscount: true,
        selectedCategory: true,
        description: true,
        type: true,
        emirate: true,
        discount: true,
        updates: {
          orderBy: { updatedAt: "desc" },
          where: updatesWhere,
          take: 6,
          include: {
            sharedSettings: {
              where: sharedUpdatesWhere,
            },
          },
        },
      },
    });
  }

  aggregateLeads({ where }) {
    return prisma.clientLead.aggregate({
      where,
      _count: { id: true },
      _sum: { averagePrice: true },
    });
  }

  aggregateExtraServices({ where }) {
    return prisma.extraService.aggregate({
      where: {
        clientLead: {
          ...where,
        },
      },
      _sum: {
        price: true,
      },
    });
  }

  // ── getLeadDetailsByProject ──────────────────────────────────────────────────────
  findLeadDetailsByProject({ where, projectsWhere, filesAndNotesWhere, userIdWhere }) {
    return prisma.clientLead.findUnique({
      where,
      select: {
        id: true,
        clientDescription: true,
        country: true,
        timeToContact: true,
        priceNote: true,
        ourCost: true,
        contractorCost: true,
        telegramLink: true,
        stripieMetadata: true,

        projects: {
          where: projectsWhere,
          select: {
            id: true,
            type: true,
            status: true,
            area: true,
            deliveryTime: true,
            priority: true,
            startedAt: true,
            endedAt: true,
            clientLeadId: true,
            groupTitle: true,
            groupId: true,
            statusChangedAt: true,
            updatedAt: true,
            createdAt: true,
            isModification: true,
            assignments: {
              select: {
                id: true,
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
        client: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
        selectedCategory: true,
        description: true,
        type: true,
        emirate: true,
        price: true,
        averagePrice: true,
        priceWithOutDiscount: true,
        discount: true,
        files: {
          where: filesAndNotesWhere,
          select: {
            id: true,
            name: true,
            url: true,
            createdAt: true,
            description: true,
            isUserFile: true,
            user: {
              select: { name: true },
            },
          },
        },
        priceOffers: {
          where: userIdWhere,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            minPrice: true,
            maxPrice: true,
            note: true,
            userId: true,
            url: true,
            user: {
              select: { name: true },
            },
            createdAt: true,
          },
        },
        notes: {
          where: filesAndNotesWhere,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            content: true,
            userId: true,
            user: {
              select: { name: true },
            },
            createdAt: true,
          },
        },
        callReminders: {
          where: userIdWhere,
          select: {
            id: true,
            time: true,
            status: true,
            reminderReason: true,
            callResult: true,
            userId: true,
            user: {
              select: { name: true },
            },
          },
          orderBy: { time: "desc" },
        },
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  // ── getUniqueProjectGroups — getProjectsGrouped ──────────────────────────────────
  findProjectsGrouped({ clientLeadId }) {
    const where = {
      clientLeadId: Number(clientLeadId),
    };
    return prisma.project.findMany({
      where,
      distinct: ["groupId", "groupTitle"],
      select: { groupId: true, groupTitle: true },
      orderBy: [{ groupTitle: "asc" }, { groupId: "asc" }],
    });
  }
}

export const projectRepository = new ProjectRepository();
export { ProjectRepository };
