import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";
import { v4 as uuidv4 } from "uuid";
import {
  newProjectAssingmentNotification,
  updateProjectNotification,
} from "../../notification.js";
import {
  addUsersToATeleChannelUsingQueue,
  notifyUsersAddedToProject,
  notifyUsersWithTheNewProjectStatus,
  uploadANote,
} from "../../telegram/telegram-functions.js";
import { dealsLink } from "../../links.js";
import {
  checkIfProjectHasPaymentAndUpdate,
  checkIfProjectHasStagesAndUpdateNextAndPrevious,
} from "../contract/contractServices.js";
import prisma from "../../../prisma/prisma.js";
import {
  addADesginerToAllRelatedProjectsRooms,
  addMemberToRoomBySystem,
} from "../chat/chatMemberServices.js";

dayjs.extend(utc);
dayjs.extend(timezone);

const PROJECT_TYPES = [
  "2D_Study",
  "3D_Designer",
  "3D_Modification",
  "2D_Final_Plans",
  "2D_Quantity_Calculation",
];

function sortProjectsByTypeOrder(projects, order = PROJECT_TYPES) {
  const orderIndex = new Map(order.map((t, i) => [t, i]));
  const FALLBACK = order.length;
  return [...projects].sort((a, b) => {
    const ai = orderIndex.has(a.type) ? orderIndex.get(a.type) : FALLBACK;
    const bi = orderIndex.has(b.type) ? orderIndex.get(b.type) : FALLBACK;
    return ai - bi;
  });
}

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

async function getProjects(clientLeadId) {
  const { now, start, end } = todayRange();
  const meetingOrNot = {
    OR: [
      { meeting: { is: { status: { in: ["IN_PROGRESS"] } } } },
      { meeting: null },
      { meetingReminderId: null },
    ],
  };
  const projects = await prisma.project.findMany({
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
  return projects;
}

async function createProjects(clientLeadId, groupTitle = "Initial Project") {
  const highestGroupRecord = await prisma.project.findFirst({
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
  await prisma.project.createMany({
    data: newProjects.map((project) => ({
      ...project,
      clientLeadId: Number(clientLeadId),
    })),
  });
  return newProjects;
}

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

export async function getProjectsByClientLeadId({ searchParams }) {
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
    const isPresent = await prisma.project.findFirst({
      where: {
        groupId: 1,
        clientLeadId: Number(clientLeadId),
        groupTitle: "Initial Project",
      },
    });

    if (!isPresent) {
      await prisma.project.createMany({
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
  const checkForTitle = await prisma.project.findFirst({
    where: {
      id: Number(clientleadId),
      groupTitle: title,
    },
  });
  if (checkForTitle) {
    throw new Error("There is a group with the same title");
  }
  const projects = await createProjects(Number(clientleadId), title);
  const groupProjects = {
    groupId: projects[0].groupId,
    groupTitle: projects[0].groupTitle,
    projects,
  };
  return groupProjects;
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
    const assignment = await prisma.assignment.findFirst({
      where: {
        userId: Number(userId),
        projectId: Number(projectId),
      },
    });
    if (assignment) {
      throw new Error(
        "This designer is already assigned to this project, refresh page if u didnt find him."
      );
    }
  };
  await checkIfUserIsAlreadyAssigned();
  let modificationProject;
  if (removeFromModification || addToModification) {
    const clientLead = await prisma.clientLead.findFirst({
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
    if (clientLead) {
      modificationProject = await prisma.project.findFirst({
        where: {
          clientLeadId: Number(clientLead.id),
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
  }
  if (deleteDesigner) {
    const oldAssignment = await prisma.assignment.findUnique({
      where: {
        id: Number(assignmentId),
      },
    });
    await prisma.assignment.delete({
      where: {
        id: Number(assignmentId),
      },
    });
    if (removeFromModification && modificationProject) {
      const assignmentToDelete = await prisma.assignment.findFirst({
        where: {
          projectId: modificationProject.id,
          userId: oldAssignment.userId,
        },
      });
      if (assignmentToDelete) {
        await prisma.assignment.delete({
          where: {
            id: assignmentToDelete.id,
          },
        });
      }
    }
  } else {
    await prisma.assignment.create({
      data: {
        userId: Number(userId),
        projectId: Number(projectId),
      },
    });
    if (addToModification && modificationProject) {
      await prisma.assignment.create({
        data: {
          userId: Number(userId),
          projectId: Number(modificationProject.id),
        },
      });
    }
  }
  const project = await prisma.project.findUnique({
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
  const content = project.clientLeadId
    ? `This project is also linked to a lead <a href="${
        dealsLink + "/" + project.clientLeadId
      }" >#${project.clientLeadId}</a> `
    : "";
  if (!deleteDesigner) {
    const user = await prisma.user.findUnique({
      where: {
        id: Number(userId),
      },
    });
    if (user.telegramUsername) {
      await addUsersToATeleChannelUsingQueue({
        clientLeadId: project.clientLeadId,
        usersList: [user],
      });
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

export async function updateProject({ data, isAdmin }) {
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
  const oldProject = await prisma.project.findUnique({
    where: { id: Number(id) },
    select: { deliveryTime: true, status: true },
  });
  const updatedProject = await prisma.project.update({
    where: { id: Number(id) },
    data: updatedData,
  });
  const project = await prisma.project.findUnique({
    where: { id: Number(id) },
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
    const modificationProject = await prisma.project.updateMany({
      where: {
        groupId: project.groupId,
        clientLeadId: project.clientLeadId,
        type: "3D_Modification",
      },
      data: {
        isModification: true,
      },
    });
  }
  if (project.status !== "To Do" && !project.startedAt) {
    await prisma.project.update({
      where: {
        id: Number(project.id),
      },
      data: {
        startedAt: new Date(),
      },
    });
    project.startedAt = new Date();
  }
  if (project.status === "Completed") {
    if (!project.endedAt) {
      await prisma.project.update({
        where: {
          id: Number(project.id),
        },
        data: {
          endedAt: new Date(),
        },
      });
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

export async function getUserProjects(searchParams, limit, skip) {
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
  const projects = await prisma.project.findMany({
    where,
    take: limit,
    skip: skip,
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
  const total = await prisma.project.count({
    where,
  });
  const totalPages = Math.ceil(total / limit);
  return {
    data: projects,
    limit,
    total,
    totalPages,
  };
}

export async function getProjectDetailsById({ id, searchParams }) {
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
  const project = await prisma.project.findUnique({
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
  if (
    project &&
    project.type === "3D_Modification" &&
    !project.isModification
  ) {
    throw new Error("This project is not in modification state yet");
  }
  return project;
}

export async function getLeadByPorjects({ searchParams, isAdmin }) {
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

  const rawLeads = await prisma.clientLead.findMany({
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
          role: true,
          area: true,
          deliveryTime: true,
          priority: true,
          startedAt: true,
          endedAt: true,
          clientLeadId: true,
          isModification: true,
          groupTitle: true,
          groupId: true,
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
                in: ["TODO", "IN_PROGRESS"],
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

export async function getLeadByPorjectsColumn({ searchParams, isAdmin }) {
  const filters =
    searchParams.filters &&
    searchParams.filters !== "undefined" &&
    JSON.parse(searchParams.filters);
  const { now, start, end } = todayRange();
  const meetingOrNot = {
    OR: [
      { meeting: { is: { status: { in: ["IN_PROGRESS"] } } } },
      { meeting: null },
      { meetingReminderId: null },
    ],
  };
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

  const rawLeads = await prisma.clientLead.findMany({
    where,
    skip: Number(searchParams.skip) || 0,
    take: Number(searchParams.take) || 20,
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
          role: true,
          area: true,
          deliveryTime: true,
          priority: true,
          startedAt: true,
          endedAt: true,
          clientLeadId: true,
          isModification: true,
          groupTitle: true,
          groupId: true,
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
                in: ["TODO", "IN_PROGRESS"],
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
  // Step 1: Aggregate averagePrice from clientLead
  const consolusion = await prisma.clientLead.aggregate({
    where,
    _count: { id: true },
    _sum: { averagePrice: true },
  });

  // Step 2: Aggregate ExtraService prices linked to those leads
  const extraServicesTotal = await prisma.extraService.aggregate({
    where: {
      clientLead: {
        ...where, // same filter applied to clientLead
      },
    },
    _sum: {
      price: true,
    },
  });

  // Step 3: Add them together
  const averagePrice = Number(consolusion._sum.averagePrice ?? 0);
  const extraServicesPrice = Number(extraServicesTotal._sum.price ?? 0);

  const totalValue = (averagePrice + extraServicesPrice).toFixed(2);

  const totalLeads = consolusion._count.id;
  return { data: data, totalValue, totalLeads };
}

export { todayRange };
export async function getLeadDetailsByProject(clientLeadId, searchParams) {
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
      // where.projects.some.userId = Number(searchParams.userId);
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
    // projectsWhere.userId = Number(searchParams.userId);
    userIdWhere.userId = Number(searchParams.userId);
    if (
      searchParams.type !== "3D_Designer" &&
      searchParams.type !== "3D_Modification" &&
      searchParams.type !== "three-d"
    ) {
      filesAndNotesWhere.userId = Number(searchParams.userId);
    }
  }
  const clientLead = await prisma.clientLead.findUnique({
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
          role: true,
          groupTitle: true,
          groupId: true,
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
  const where = {
    clientLeadId: Number(clientLeadId),
  };
  return await prisma.project.findMany({
    where,
    distinct: ["groupId", "groupTitle"],
    select: { groupId: true, groupTitle: true },
    orderBy: [{ groupTitle: "asc" }, { groupId: "asc" }],
  });
}
export async function getUniqueProjectGroups({ clientLeadId }) {
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
    const isPresent = await prisma.project.findFirst({
      where: {
        groupId: 1,
        clientLeadId: Number(clientLeadId),
        groupTitle: "Initial Project",
      },
    });
    if (!isPresent) {
      await prisma.project.createMany({
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
