// projects/project usecase — business logic / orchestration. Prisma NEVER appears
// here (only repo calls). Behavior ported 1:1 from the legacy handlers + services
// (routes/shared/projects.js, services/main/shared/{projectServices,taskServices}.js).
// Errors are thrown as AppError(code, statusCode); the envelope serializes them.
//
// THE IDOR KEYSTONE lives here: checkIfUserCanAccessProject / checkIfUserCanMutateProject
// (+ the clientLead-keyed variants). The task/update/delivery usecases resolve their
// parent project/lead and then call THESE — there is exactly ONE project-scope checker
// for the whole domain (no divergent copies).
//
// SIDE EFFECTS (notifications, telegram channels, payment/stage recompute, BullMQ) are
// a later migration phase; we invoke the EXISTING implementations via lazy imports so
// observable behavior is preserved without duplicating thousands of lines — the same
// pattern used by the migrated courses + leads modules.
import { AppError } from "../../../shared/errors/AppError.js";
import { projectsMessagesCodes as C } from "@dms/shared";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";
import { projectRepository } from "./project.repo.js";
import { PROJECT_TYPES } from "./project.constants.js";
import { groupProjects, sortProjectsByTypeOrder } from "./project.dto.js";
import {
  newProjectAssingmentNotification,
  updateProjectNotification,
} from "../../../infra/notifications/legacy-notification.js";
import {
  addUsersToATeleChannelUsingQueue,
  notifyUsersAddedToProject,
  notifyUsersWithTheNewProjectStatus,
  uploadANote,
} from "../../../infra/telegram/telegram-functions.js";
import { dealsLink } from "../../../infra/config/links.js";

dayjs.extend(utc);
dayjs.extend(timezone);

// ── project flows ported 1:1 from the legacy shared/legacy/project-services.js. Prisma
// I/O is delegated to projectRepository; the heavy cross-module side effects
// (contract-services payment/stage recompute, chat room membership) are still invoked via
// lazy imports — the same courses/leads pattern (and it also breaks the pre-existing
// project↔contract static import cycle).
async function getProjects(clientLeadId) {
  return projectRepository.findProjectsWithSchedules({ clientLeadId });
}

async function createProjects(clientLeadId, groupTitle = "Initial Project") {
  const highestGroupRecord = await projectRepository.findHighestGroup({ clientLeadId });
  const nextGroupId = highestGroupRecord ? highestGroupRecord.groupId + 1 : 1;

  const newProjects = [];
  PROJECT_TYPES.forEach((type) => {
    newProjects.push({
      type,
      status: "To Do",
      priority: "MEDIUM",
      startedAt: null,
      endedAt: null,
      groupTitle: groupTitle,
      groupId: nextGroupId,
      role:
        type === "3D_Designer" || type === "3D_Modification"
          ? "THREE_D_DESIGNER"
          : "TWO_D_DESIGNER",
    });
  });
  await projectRepository.createManyProjects({
    data: newProjects.map((project) => ({
      ...project,
      clientLeadId: Number(clientLeadId),
    })),
  });
  return newProjects;
}

async function getProjectsByClientLeadId({ searchParams }) {
  const { clientLeadId } = searchParams;
  let projects = await getProjects(clientLeadId);
  if (!projects || projects.length === 0) {
    const newProjects = [];
    PROJECT_TYPES.forEach((type) => {
      newProjects.push({
        type,
        status: "To Do",
        priority: "MEDIUM",
        startedAt: null,
        endedAt: null,
        groupTitle: "Initial Project",
        groupId: 1,
        role:
          type === "3D_Designer" || type === "3D_Modification"
            ? "THREE_D_DESIGNER"
            : "TWO_D_DESIGNER",
      });
    });
    const isPresent = await projectRepository.findGroupOneInitialProject({ clientLeadId });

    if (!isPresent) {
      await projectRepository.createManyProjects({
        data: newProjects.map((project) => ({
          ...project,
          clientLeadId: Number(clientLeadId),
        })),
      });
    }
    projects = await getProjects(clientLeadId);
  }

  const groupedProjects = groupProjects(sortProjectsByTypeOrder(projects));

  return groupedProjects;
}

export async function createGroupProjects({ clientleadId, title }) {
  if (!title) {
    throw new Error("Title is required");
  }
  const checkForTitle = await projectRepository.findProjectByIdAndTitle({
    id: clientleadId,
    title,
  });
  if (checkForTitle) {
    throw new Error("There is a group with the same title");
  }
  const projects = await createProjects(Number(clientleadId), title);
  const groupProjectsResult = {
    groupId: projects[0].groupId,
    groupTitle: projects[0].groupTitle,
    projects,
  };
  return groupProjectsResult;
}

export async function assignProjectToUser({
  projectId,
  userId,
  assignmentId,
  deleteDesigner,
  addToModification,
  removeFromModification,
  groupId,
}) {
  const checkIfUserIsAlreadyAssigned = async () => {
    const assignment = await projectRepository.findAssignment({ userId, projectId });
    if (assignment) {
      throw new Error(
        "This designer is already assigned to this project, refresh page if u didnt find him."
      );
    }
  };
  await checkIfUserIsAlreadyAssigned();
  let modificationProject;
  if (removeFromModification || addToModification) {
    const clientLead = await projectRepository.findClientLeadIdByProject({ projectId });
    if (clientLead) {
      modificationProject = await projectRepository.findModificationProject({
        clientLeadId: clientLead.id,
        groupId,
      });
    }
  }
  if (deleteDesigner) {
    const oldAssignment = await projectRepository.findAssignmentById({ assignmentId });
    await projectRepository.deleteAssignmentById({ id: assignmentId });
    if (removeFromModification && modificationProject) {
      const assignmentToDelete = await projectRepository.findAssignmentByProjectUser({
        projectId: modificationProject.id,
        userId: oldAssignment.userId,
      });
      if (assignmentToDelete) {
        await projectRepository.deleteAssignmentById({ id: assignmentToDelete.id });
      }
    }
  } else {
    await projectRepository.createAssignment({ userId, projectId });
    if (addToModification && modificationProject) {
      await projectRepository.createAssignment({
        userId,
        projectId: modificationProject.id,
      });
    }
  }
  const project = await projectRepository.findProjectWithAssignments({ projectId });
  const content = project.clientLeadId
    ? `This project is also linked to a lead <a href="${
        dealsLink + "/" + project.clientLeadId
      }" >#${project.clientLeadId}</a> `
    : "";
  if (!deleteDesigner) {
    const user = await projectRepository.findUserById({ userId });
    if (user.telegramUsername) {
      await addUsersToATeleChannelUsingQueue({
        clientLeadId: project.clientLeadId,
        usersList: [user],
      });
      const { addADesginerToAllRelatedProjectsRooms } = await import(
        "../../chat/system-rooms.js"
      );
      await addADesginerToAllRelatedProjectsRooms({
        clientLeadId: project.clientLeadId,
        userId: user.id,
      });
      await notifyUsersAddedToProject({
        projectId: project.id,
        clientLeadId: project.clientLeadId,
        type: project.type,
        username: user.telegramUsername,
      });
    }
    await newProjectAssingmentNotification(project.id, Number(userId), content);
  }
  return project;
}

async function updateProject({ data, isAdmin }) {
  const { id, status, deliveryTime, ...rest } = data;
  if (data.oldStatus) {
    if (
      !data.isAdmin &&
      (data.oldStatus === "Completed" ||
        data.oldStatus === "Canceled" ||
        data.oldStatus === "Rejected")
    ) {
      throw new Error(
        "You can't change the status after Completion or Cancellation or Rejection"
      );
    }

    delete rest.oldStatus;
    delete rest.isAdmin;
  }

  const updatedData = {
    ...rest,
    deliveryTime: deliveryTime
      ? new Date(deliveryTime).toISOString()
      : undefined,
    status,
    ...(status === "Completed" && { endedAt: new Date() }),
  };

  delete updatedData.id;
  delete updatedData.userId;

  delete updatedData.startedAt;
  delete updatedData.user;
  delete updatedData.clientLeadId;
  delete updatedData.clientLead;
  delete updatedData.assignments;
  delete updatedData.tasks;
  if (updatedData.deliverySchedules?.length === 0) {
    delete updatedData.deliverySchedules;
  }
  const oldProject = await projectRepository.findProjectDeliveryStatus({ id });
  const updatedProject = await projectRepository.updateProjectById({ id, data: updatedData });
  const project = await projectRepository.findProjectWithAssignments({ projectId: id });

  if (
    updatedData.deliveryTime &&
    !dayjs(updatedData.deliveryTime).isSame(
      dayjs(oldProject.deliveryTime),
      "day"
    )
  ) {
    const now = dayjs.utc().startOf("day");
    const deliveryDate = dayjs(updatedData.deliveryTime);
    const daysLeft = deliveryDate.diff(now, "day");

    let timeLeftLabel;
    if (daysLeft === 1) timeLeftLabel = "Tomorrow";
    else if (daysLeft === 0) timeLeftLabel = "Today";
    else timeLeftLabel = `${daysLeft} days left`;
    const note = {
      id: `${project.id}-${project.clientLeadId}`,
      clientLeadId: Number(project.clientLeadId),
      content: `⏳ Project ${project.type} delivery time : ` + timeLeftLabel,
      binMessage: true,
    };
    await uploadANote(note);
  }
  if (project.status === "Modification" && project.type === "3D_Designer") {
    const modificationProject = await projectRepository.updateManyModification({
      groupId: project.groupId,
      clientLeadId: project.clientLeadId,
    });
  }
  if (project.status !== "To Do" && !project.startedAt) {
    await projectRepository.setProjectStarted({ id: project.id });
    project.startedAt = new Date();
  }
  if (project.status === "Completed") {
    if (!project.endedAt) {
      await projectRepository.setProjectEnded({ id: project.id });
      project.endedAt = new Date();
    }
    if (oldProject.status !== "Completed") {
      await notifyUsersWithTheNewProjectStatus({
        projectId: project.id,
        clientLeadId: project.clientLeadId,
        type: project.type,
      });
    }
  }
  const content = updatedData.status
    ? `Project status has been changed to ${project.status}`
    : updatedData.priority
    ? `Project priority has been changed to ${project.priority}`
    : "New updates on the project";
  let extra = "";
  if (project.clientLeadId) {
    extra = ` This project is also linked to a lead <a href="${
      dealsLink + "/" + project.clientLeadId
    }" >#${project.clientLeadId}</a> `;
  }
  if (project.assignments && !isAdmin) {
    project.assignments.forEach(async (assigmnet) => {
      await updateProjectNotification(
        project.id,
        assigmnet.userId,
        content + extra,
        false
      );
    });
  } else if (isAdmin) {
    await updateProjectNotification(project.id, null, content + extra, isAdmin);
  }
  const { checkIfProjectHasStagesAndUpdateNextAndPrevious, checkIfProjectHasPaymentAndUpdate } =
    await import("../../contracts/legacy/contract-services.js");
  await checkIfProjectHasStagesAndUpdateNextAndPrevious({
    projectId: project.id,
    status: project.status,
    clientLeadId: project.clientLeadId,
    groupId: project.groupId,
    groupTitle: project.groupTitle,
  });
  await checkIfProjectHasPaymentAndUpdate({
    projectId: project.id,
    status: project.status,
    clientLeadId: project.clientLeadId,
  });
  return updatedProject;
}

async function getUserProjects(searchParams, limit, skip) {
  const where = {};
  const filters =
    searchParams.filters &&
    searchParams.filters !== "undefined" &&
    JSON.parse(searchParams.filters);
  if (searchParams.userId) {
    where.assignments = {
      some: {
        userId: Number(searchParams.userId),
      },
    };
  }
  if (filters && filters !== "undefined" && filters.leadId) {
    where.clientLeadId = Number(filters.leadId);
  }
  const projects = await projectRepository.findUserProjects({ where, take: limit, skip });
  const total = await projectRepository.countProjects({ where });
  const totalPages = Math.ceil(total / limit);
  return {
    data: projects,
    limit,
    total,
    totalPages,
  };
}

async function getProjectDetailsById({ id, searchParams }) {
  const where = {
    id: Number(id),
  };
  if (searchParams.userId && searchParams.userId !== "null") {
    where.assignments = {
      some: {
        userId: Number(searchParams.userId),
      },
    };
  }
  if (searchParams.clientLeadId) {
    where.clientLeadId = Number(searchParams.clientLeadId);
  }
  const project = await projectRepository.findProjectDetail({ where });
  if (
    project &&
    project.type === "3D_Modification" &&
    !project.isModification
  ) {
    throw new Error("This project is not in modification state yet");
  }
  return project;
}

async function getLeadByPorjects({ searchParams, isAdmin }) {
  const filters =
    searchParams.filters &&
    searchParams.filters !== "undefined" &&
    JSON.parse(searchParams.filters);
  const where = { leadType: "NORMAL" };
  const projectWhere = {};
  const updatesWhere = {};
  const sharedUpdatesWhere = {};
  if (searchParams.type) {
    where.projects = {
      some: {
        type: searchParams.type,
      },
    };
    projectWhere.type = searchParams.type;
    if (searchParams.userId) {
      where.projects.some.assignments = {
        some: {
          userId: Number(searchParams.userId),
        },
      };
      projectWhere.assignments = {
        some: {
          userId: Number(searchParams.userId),
        },
      };
    }
    if (!isAdmin) {
      sharedUpdatesWhere.type = searchParams.type;
    }
    updatesWhere.OR = [
      {
        department: searchParams.type,
        sharedSettings: {
          some: {
            isArchived: false,
            excludeFromSearch: false,
          },
        },
      },
      {
        sharedSettings: {
          some: {
            type: searchParams.type,
            isArchived: false,
          },
        },
      },
    ];
  }
  if (isAdmin) {
    updatesWhere.OR ||= [];
    updatesWhere.OR.push({
      sharedSettings: {
        some: {
          type: "ADMIN",
          isArchived: false,
        },
      },
    });
  }

  if (filters?.clientId && filters.clientId !== "all") {
    where.clientId = Number(filters.clientId);
  }
  if (filters.id && filters.id !== "all") {
    where.id = Number(filters.id);
  }
  if (
    filters?.staffId &&
    filters?.staffId !== "all" &&
    filters?.staffId !== "undefined"
  ) {
    where.projects.some.assignments = {
      some: {
        userId: Number(filters.staffId),
      },
    };
    projectWhere.assignments = {
      some: {
        userId: Number(filters.staffId),
      },
    };
  }
  if (searchParams.isAdmin && !searchParams.userId && !filters?.staffId) {
    where.projects ??= { some: {} };
    where.projects.some ??= {};
    where.projects.some.assignments = {
      some: {
        userId: {
          not: undefined,
        },
      },
    };
    projectWhere.assignments = {
      some: {
        userId: {
          not: undefined,
        },
      },
    };
  }
  if (searchParams.isArchieved) {
    where.status = "ARCHIVED";
  } else {
    where.status = {
      notIn: ["ARCHIVED", "NEW"],
    };
  }

  const getTaskVisibilityFilter = (userRole) => {
    const allowedRoles = ["ADMIN", "SUPER_ADMIN", "THREE_D_DESIGNER"];

    if (allowedRoles.includes(userRole)) {
      return {
        type: {
          in: ["PROJECT", "MODIFICATION"],
        },
      };
    } else {
      return {
        type: "PROJECT",
      };
    }
  };

  const userRole = searchParams.userRole;
  const taskFilter = getTaskVisibilityFilter(userRole);

  const rawLeads = await projectRepository.findLeadByProjects({
    where,
    projectWhere,
    updatesWhere,
    sharedUpdatesWhere,
    taskFilter,
  });
  const expandedLeads = rawLeads.flatMap((lead) => {
    if (!lead.projects || lead.projects.length === 0) return [];

    return lead.projects.map((primaryProject, i) => {
      const reorderedProjects = [
        primaryProject,
        ...lead.projects.filter((_, j) => j !== i),
      ];

      const processedProjects = reorderedProjects.map((project) => ({
        ...project,
        tasks: project.tasks?.filter((task) => task.type === "PROJECT"),
        modifications: project.tasks?.filter(
          (task) => task.type === "MODIFICATION"
        ),
      }));

      return {
        ...lead,
        projects: processedProjects,
      };
    });
  });

  return expandedLeads;
}

async function getLeadByPorjectsColumn({ searchParams, isAdmin }) {
  const filters =
    searchParams.filters &&
    searchParams.filters !== "undefined" &&
    JSON.parse(searchParams.filters);
  const where = { leadType: "NORMAL" };
  const projectWhere = {};
  const updatesWhere = {};
  const sharedUpdatesWhere = {};
  if (searchParams.type) {
    where.projects = {
      some: {
        type: searchParams.type,
      },
    };
    projectWhere.type = searchParams.type;
    if (searchParams.userId) {
      where.projects.some.assignments = {
        some: {
          userId: Number(searchParams.userId),
        },
      };
      projectWhere.assignments = {
        some: {
          userId: Number(searchParams.userId),
        },
      };
    }
    if (!isAdmin) {
      sharedUpdatesWhere.type = searchParams.type;
    }
    updatesWhere.OR = [
      {
        department: searchParams.type,
        sharedSettings: {
          some: {
            isArchived: false,
            excludeFromSearch: false,
          },
        },
      },
      {
        sharedSettings: {
          some: {
            type: searchParams.type,
            isArchived: false,
          },
        },
      },
    ];
  }
  if (isAdmin) {
    updatesWhere.OR ||= [];
    updatesWhere.OR.push({
      sharedSettings: {
        some: {
          type: "ADMIN",
          isArchived: false,
        },
      },
    });
  }
  if (searchParams.status) {
    if (where.projects) {
      where.projects.some.status = searchParams.status;
    } else {
      where.projects = {
        some: {
          status: searchParams.status,
        },
      };
    }
    projectWhere.status = searchParams.status;
  }
  if (filters?.clientId && filters.clientId !== "all") {
    where.clientId = Number(filters.clientId);
  }
  if (filters.id && filters.id !== "all") {
    where.id = Number(filters.id);
  }
  if (
    filters?.staffId &&
    filters?.staffId !== "all" &&
    filters?.staffId !== "undefined"
  ) {
    where.projects.some.assignments = {
      some: {
        userId: Number(filters.staffId),
      },
    };
    projectWhere.assignments = {
      some: {
        userId: Number(filters.staffId),
      },
    };
  }
  if (searchParams.isAdmin && !searchParams.userId && !filters?.staffId) {
    where.projects ??= { some: {} };
    where.projects.some ??= {};
    where.projects.some.assignments = {
      some: {
        userId: {
          not: undefined,
        },
      },
    };
    projectWhere.assignments = {
      some: {
        userId: {
          not: undefined,
        },
      },
    };
  }
  if (searchParams.isArchieved) {
    where.status = "ARCHIVED";
  } else {
    where.status = {
      notIn: ["ARCHIVED", "NEW"],
    };
  }

  const getTaskVisibilityFilter = (userRole) => {
    const allowedRoles = ["ADMIN", "SUPER_ADMIN", "THREE_D_DESIGNER"];

    if (allowedRoles.includes(userRole)) {
      return {
        type: {
          in: ["PROJECT", "MODIFICATION"],
        },
      };
    } else {
      return {
        type: "PROJECT",
      };
    }
  };

  const userRole = searchParams.userRole;
  const taskFilter = getTaskVisibilityFilter(userRole);

  const rawLeads = await projectRepository.findLeadByProjectsColumn({
    where,
    projectWhere,
    updatesWhere,
    sharedUpdatesWhere,
    taskFilter,
    skip: searchParams.skip,
    take: searchParams.take,
  });
  const expandedLeads = rawLeads.flatMap((lead) => {
    if (!lead.projects || lead.projects.length === 0) return [];

    return lead.projects.map((primaryProject, i) => {
      const reorderedProjects = [
        primaryProject,
        ...lead.projects.filter((_, j) => j !== i),
      ];

      const processedProjects = reorderedProjects.map((project) => ({
        ...project,
        tasks: project.tasks?.filter((task) => task.type === "PROJECT"),
        modifications: project.tasks?.filter(
          (task) => task.type === "MODIFICATION"
        ),
      }));

      return {
        ...lead,
        projects: processedProjects,
      };
    });
  });
  function getPriorityOrder(priority) {
    const priorityMap = {
      VERY_HIGH: 5,
      HIGH: 4,
      MEDIUM: 3,
      LOW: 2,
      VERY_LOW: 1,
    };
    return priorityMap[priority] || 3; // Default to MEDIUM
  }
  const data = expandedLeads
    .filter((lead) => {
      if (
        lead.projects[0].type === "3D_Modification" &&
        !lead.projects[0].isModification
      ) {
        return false;
      }
      return lead.projects[0]?.status === searchParams.status;
    })
    .sort((a, b) => {
      const priorityA = getPriorityOrder(a.projects[0]?.priority);
      const priorityB = getPriorityOrder(b.projects[0]?.priority);
      return priorityB - priorityA; // HIGH priority first
    });
  const consolusion = await projectRepository.aggregateLeads({ where });

  const extraServicesTotal = await projectRepository.aggregateExtraServices({ where });

  const averagePrice = Number(consolusion._sum.averagePrice ?? 0);
  const extraServicesPrice = Number(extraServicesTotal._sum.price ?? 0);

  const totalValue = (averagePrice + extraServicesPrice).toFixed(2);

  const totalLeads = consolusion._count.id;
  return { data: data, totalValue, totalLeads };
}

async function getLeadDetailsByProject(clientLeadId, searchParams) {
  const where = { id: clientLeadId };
  const userIdWhere = {};
  let filesAndNotesWhere = {};
  let projectsWhere = {};

  if (searchParams.type === "three-d") {
    const some = {
      type: { in: ["3D_Designer", "3D_Modification"] },
    };
    where.projects = {
      some,
    };
    projectsWhere.type = some.type;
  } else if (searchParams.type === "two-d") {
    const some = {
      type: { in: ["2D_Study", "2D_Final_Plans", "2D_Quantity_Calculation"] },
    };
    where.projects = {
      some,
    };
    projectsWhere.type = some.type;
  } else {
    where.projects = {
      some: {
        type: searchParams.type,
      },
    };
    projectsWhere.type = searchParams.type;
  }

  if (searchParams.userId) {
    if (where.projects) {
      where.projects.some.assignments = {
        some: {
          userId: Number(searchParams.userId),
        },
      };
    } else {
      where.projects = {
        some: {
          assignments: {
            some: {
              userId: Number(searchParams.userId),
            },
          },
        },
      };
    }
    projectsWhere.assignments = {
      some: {
        userId: Number(searchParams.userId),
      },
    };
    userIdWhere.userId = Number(searchParams.userId);
    if (
      searchParams.type !== "3D_Designer" &&
      searchParams.type !== "3D_Modification" &&
      searchParams.type !== "three-d"
    ) {
      filesAndNotesWhere.userId = Number(searchParams.userId);
    }
  }
  const clientLead = await projectRepository.findLeadDetailsByProject({
    where,
    projectsWhere,
    filesAndNotesWhere,
    userIdWhere,
  });

  if (!clientLead) {
    throw new Error(`ClientLead with ID ${clientLeadId} not found`);
  }
  clientLead.callReminders = [
    ...clientLead.callReminders.filter((call) => call.status === "IN_PROGRESS"),
    ...clientLead.callReminders.filter((call) => call.status !== "IN_PROGRESS"),
  ];
  return clientLead;
}

async function getProjectsGrouped({ clientLeadId }) {
  return projectRepository.findProjectsGrouped({ clientLeadId });
}

async function getUniqueProjectGroups({ clientLeadId }) {
  const groups = await getProjectsGrouped({ clientLeadId });
  if (!groups || groups.length === 0) {
    const newProjects = [];
    PROJECT_TYPES.forEach((type) => {
      newProjects.push({
        type,
        status: "To Do",
        priority: "MEDIUM",
        startedAt: null,
        endedAt: null,
        groupTitle: "Initial Project",
        groupId: 1,
        role:
          type === "3D_Designer" || type === "3D_Modification"
            ? "THREE_D_DESIGNER"
            : "TWO_D_DESIGNER",
      });
    });
    const isPresent = await projectRepository.findGroupOneInitialProject({ clientLeadId });
    if (!isPresent) {
      await projectRepository.createManyProjects({
        data: newProjects.map((project) => ({
          ...project,
          clientLeadId: Number(clientLeadId),
        })),
      });
    }
    groups = await getProjectsGrouped({ clientLeadId });
  }

  return groups;
}

const legacyDefaults = {
  getLeadByPorjects,
  getLeadByPorjectsColumn,
  getLeadDetailsByProject,
  getProjectsByClientLeadId,
  getUserProjects,
  getProjectDetailsById,
  updateProject,
  assignProjectToUser,
  getUniqueProjectGroups,
};

// Project board statuses a NON-admin user cannot transition AWAY from (legacy
// updateProject rule). Used by the workflow-guard + the dto capability.
const LOCKED_FROM_STATUSES_FOR_NON_ADMIN = ["Completed", "Canceled", "Rejected"];

export class ProjectUsecase {
  /**
   * @param {import("./project.repo.js").ProjectRepository} repository
   * @param {Partial<typeof legacyDefaults>} [legacy]
   */
  constructor(repository, legacy = {}) {
    this.repo = repository;
    this.legacy = { ...legacyDefaults, ...legacy };
  }

  isAdminUser(authUser) {
    // Authoritative: the resolved current profile's admin-tier flag (from
    // requireAuth) — object scope follows the ACTIVE profile. Falls back to the
    // legacy role/flag computation for raw users without a resolved profile.
    if (typeof authUser?.isAdminTier === "boolean") return authUser.isAdminTier;
    return (
      authUser?.role === "ADMIN" ||
      authUser?.role === "SUPER_ADMIN" ||
      Boolean(authUser?.isSuperSales)
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  //  SCOPE CHECKERS — the keystone IDOR fix (shared by task/update/delivery)
  // ════════════════════════════════════════════════════════════════════════════
  // Read scope: full-read roles (ADMIN/SUPER_ADMIN/ACCOUNTANT/isSuperSales) see all;
  // everyone else only projects they are ASSIGNED to. Throws 403 PROJECT_ACCESS_DENIED
  // when the project is outside scope (or does not exist — we do not leak existence to
  // an unauthorized caller).
  async checkIfUserCanAccessProject({ id, authUser }) {
    const where = this.repo.buildAuthUserProjectWhere({
      authUser,
      where: { id: Number(id) },
      mode: "view",
    });
    const project = await this.repo.findScopedProject({ where });
    if (!project) throw new AppError(C.PROJECT_ACCESS_DENIED, 403);
    return project;
  }

  // Write scope: stricter — ACCOUNTANT loses full scope here (it was a read-only
  // carve-out in legacy); owned-via-assignment for non-admin.
  async checkIfUserCanMutateProject({ id, authUser }) {
    const where = this.repo.buildAuthUserProjectWhere({
      authUser,
      where: { id: Number(id) },
      mode: "mutate",
    });
    const project = await this.repo.findScopedProject({ where });
    if (!project) throw new AppError(C.PROJECT_MUTATE_DENIED, 403);
    return project;
  }

  // user-profile READ scope: GET /user-profile/:userId returns a user's assigned projects
  // INCLUDING full client PII (clientLead.client). Legacy had NO object check — any authed
  // user with PROJECT.LIST could enumerate another employee's projects + client PII (IDOR).
  // Fix: admin-tier callers (the SAME FULL_READ_ROLES/isSuperSales set the module uses via
  // repo.hasFullScope) may query ANY userId; everyone else may only query their OWN id.
  async checkIfUserCanAccessUserProfile({ userId, authUser }) {
    const targetId = Number(userId);
    if (this.repo.hasFullScope(authUser, "view")) return { userId: targetId };
    if (Number(authUser.id) === targetId) return { userId: targetId };
    throw new AppError(C.PROJECT_ACCESS_DENIED, 403);
  }

  // clientLead-keyed READ scope (for project-list-by-lead, groups, updates, archived).
  // Full-read roles pass; a non-privileged user must have at least one project on this
  // lead assigned to them (mirrors the legacy `assignments.some.userId` narrowing).
  async checkIfUserCanAccessLeadProjects({ clientLeadId, authUser }) {
    if (this.repo.hasFullScope(authUser, "view")) return { clientLeadId: Number(clientLeadId) };
    const allowed = await this.repo.clientLeadHasAssignedProject({
      clientLeadId,
      userId: authUser.id,
    });
    if (!allowed) throw new AppError(C.PROJECT_ACCESS_DENIED, 403);
    return { clientLeadId: Number(clientLeadId) };
  }

  // ════════════════════════════════════════════════════════════════════════════
  //  DESIGNER BOARD LISTS (legacy getLeadByPorjects / getLeadByPorjectsColumn)
  // ════════════════════════════════════════════════════════════════════════════
  // Reproduce the legacy ROUTE narrowing exactly: ADMIN/SUPER_ADMIN → isAdmin=true;
  // everyone else → searchParams.userId = self. userRole is always forwarded.
  async designers({ query, authUser }) {
    const isAdmin = authUser.role === "ADMIN" || authUser.role === "SUPER_ADMIN";
    const searchParams = { ...query, userRole: authUser.role };
    if (isAdmin) searchParams.isAdmin = true;
    else searchParams.userId = authUser.id;
    return this.legacy.getLeadByPorjects({ searchParams, isAdmin });
  }

  async designerColumns({ query, authUser }) {
    const isAdmin = authUser.role === "ADMIN" || authUser.role === "SUPER_ADMIN";
    const searchParams = { ...query, userRole: authUser.role };
    if (isAdmin) searchParams.isAdmin = true;
    else searchParams.userId = authUser.id;
    return this.legacy.getLeadByPorjectsColumn({ searchParams, isAdmin });
  }

  // GET /designers/:id — lead-by-project detail. Object scope already enforced by the
  // checker; here we reproduce the legacy admin/accountant-vs-self search narrowing.
  async designerLeadDetail({ id, query, authUser }) {
    const { role } = authUser;
    const searchParams = { ...query };
    if (role !== "ADMIN" && role !== "SUPER_ADMIN" && role !== "ACCOUNTANT") {
      searchParams.userId = authUser.id;
    }
    if (role === "ADMIN" || role === "SUPER_ADMIN") searchParams.isAdmin = true;
    return this.legacy.getLeadDetailsByProject(Number(id), searchParams);
  }

  // ════════════════════════════════════════════════════════════════════════════
  //  PROJECT LIST & DETAIL
  // ════════════════════════════════════════════════════════════════════════════
  // GET / — projects by clientLead. Legacy narrowed non-admin via searchParams.userId;
  // we additionally enforce object scope on the lead (checkIfUserCanAccessLeadProjects)
  // before delegating, since the controller resolved it.
  async listByClientLead({ query, authUser }) {
    const searchParams = { ...query };
    if (authUser.role !== "ADMIN" && authUser.role !== "SUPER_ADMIN") {
      searchParams.userId = authUser.id;
    }
    return this.legacy.getProjectsByClientLeadId({ searchParams });
  }

  async archived({ query, authUser, skip, limit }) {
    const searchParams = { ...query };
    if (authUser.role !== "ADMIN" && authUser.role !== "SUPER_ADMIN") {
      searchParams.userId = authUser.id;
    }
    return this.#archivedFromRepo({ searchParams, skip, take: limit });
  }

  // legacy getArchivedProjects ported into the repo (it is plain Prisma + grouping).
  async #archivedFromRepo({ searchParams, skip, take }) {
    const where = { projects: { some: {} }, status: "ARCHIVED" };
    const filters = JSON.parse(searchParams.filters);
    if (filters && filters !== "undefined" && filters.id) where.id = Number(filters.id);
    if (searchParams.id) where.id = Number(searchParams.id);
    if (searchParams.userId) {
      where.projects.some.assignments = { some: { userId: Number(searchParams.userId) } };
    }
    const { items, total } = await this.repo.findArchivedLeads({ where, skip, take });
    items.forEach((lead) => {
      lead.groupedProjects = groupProjects(lead.projects);
    });
    return { items, total };
  }

  // GET /user-profile/:userId — projects assigned to a user. Legacy did NOT object-scope
  // this (it returned by the path userId). We keep the legacy semantics but the route
  // requires PROJECT.LIST; the returned set is already assignment-narrowed by userId.
  async userProjects({ userId, query, limit, skip }) {
    const searchParams = { ...query, userId };
    return this.legacy.getUserProjects(searchParams, Number(limit), Number(skip));
  }

  // GET /:id — project detail. Object scope already enforced by the checker; reproduce
  // the legacy designer/staff self-narrowing.
  async getById({ id, query, authUser }) {
    const { role } = authUser;
    const searchParams = { ...query };
    if (role === "THREE_D_DESIGNER" || role === "TWO_D_DESIGNER" || role === "STAFF") {
      searchParams.userId = authUser.id;
    }
    return this.legacy.getProjectDetailsById({ id: Number(id), searchParams });
  }

  // GET /:leadId/groups — unique project groups for a lead.
  groups({ leadId }) {
    return this.legacy.getUniqueProjectGroups({ clientLeadId: Number(leadId) });
  }

  // ════════════════════════════════════════════════════════════════════════════
  //  MUTATIONS
  // ════════════════════════════════════════════════════════════════════════════
  // PUT /:id — plain field/status edit. Object scope already enforced (mutate). We
  // derive the SERVER-authoritative oldStatus from the scoped row (the checker stashed
  // it on req.scoped) and override any client-supplied oldStatus — a forged oldStatus
  // could bypass the non-admin Completed/Canceled/Rejected lock (workflow-guard fix).
  async updateProject({ id, body, authUser, currentStatus }) {
    const isAdmin = this.isAdminUser(authUser);
    const serverOldStatus =
      currentStatus ?? (await this.repo.findProjectStatus({ id: Number(id) }))?.status;
    const { oldStatus: _ignored, ...rest } = body;
    return this.legacy.updateProject({
      data: { ...rest, id: Number(id), oldStatus: serverOldStatus, isAdmin },
      isAdmin,
    });
  }

  // POST /:id/actions/assign-designer (was PUT /:id/assign-designer).
  async assignDesigner({ id, body }) {
    return this.legacy.assignProjectToUser({
      userId: body.designerId,
      projectId: Number(id),
      assignmentId: body.assignmentId,
      deleteDesigner: body.deleteDesigner,
      addToModification: body.addToModification,
      removeFromModification: body.removeFromModification,
      groupId: body.groupId,
    });
  }

  // POST /designers/:leadId/actions/change-status (was PUT /designers/:leadId/status).
  // Legacy called updateProject({ data: req.body, isAdmin }); the project id travels in
  // the body. Object scope is enforced on that body.id via the controller's checker.
  async changeDesignerStatus({ body, authUser, currentStatus }) {
    const isAdmin = this.isAdminUser(authUser);
    const serverOldStatus =
      currentStatus ?? (body.id ? (await this.repo.findProjectStatus({ id: Number(body.id) }))?.status : undefined);
    const { oldStatus: _ignored, ...rest } = body;
    return this.legacy.updateProject({
      data: { ...rest, oldStatus: serverOldStatus, isAdmin },
      isAdmin,
    });
  }

  // ── parent-resolution helpers for the sibling surfaces' scope checks ──────────────
  async resolveProjectClientLead({ projectId }) {
    const row = await this.repo.findProjectClientLead({ id: projectId });
    if (!row) throw new AppError(C.PROJECT_NOT_FOUND, 404);
    return row;
  }

  async resolveTaskProject({ taskId }) {
    const row = await this.repo.findTaskParents({ id: taskId });
    if (!row) throw new AppError(C.TASK_NOT_FOUND, 404);
    return row;
  }

  async resolveUpdateClientLead({ updateId }) {
    const row = await this.repo.findUpdateClientLead({ id: updateId });
    if (!row) throw new AppError(C.UPDATE_NOT_FOUND, 404);
    return row;
  }

  async resolveSharedUpdateClientLead({ sharedUpdateId }) {
    const row = await this.repo.findSharedUpdateClientLead({ id: sharedUpdateId });
    if (!row || !row.update) throw new AppError(C.SHARED_UPDATE_NOT_FOUND, 404);
    return { ...row, clientLeadId: row.update.clientLeadId };
  }

  async resolveDeliveryProject({ deliveryId }) {
    const row = await this.repo.findDeliveryProject({ id: deliveryId });
    if (!row || !row.projectId) throw new AppError(C.DELIVERY_NOT_FOUND, 404);
    return row;
  }
}

export const projectUsecase = new ProjectUsecase(projectRepository);
export { LOCKED_FROM_STATUSES_FOR_NON_ADMIN };
