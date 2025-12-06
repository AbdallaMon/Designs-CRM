import dayjs from "dayjs";
import {
  updateTaskNotification,
  newTaskCreatedNotification,
} from "../../notification.js";
import prisma from "../../../prisma/prisma.js";

export async function createNewTask({ data, isAdmin = false, staffId }) {
  const { userId, projectId, ...rest } = data;

  const createdTask = await prisma.task.create({
    data: {
      ...rest,
    },
  });
  const update = {};
  let project = null;
  if (projectId) {
    update.projectId = Number(projectId);
    project = await prisma.project.findUnique({
      where: {
        id: Number(projectId),
      },
      select: {
        assignments: {
          select: {
            id: true,
            user: {
              select: {
                id: true,
              },
            },
          },
        },
      },
    });
  }
  if (userId) {
    update.userId = Number(userId);
  }
  if (Object.keys(update).length > 0) {
    await prisma.task.update({
      where: {
        id: createdTask.id,
      },
      data: update,
    });
  }

  const newTask = await prisma.task.findUnique({
    where: {
      id: createdTask.id,
    },
  });

  await newTaskCreatedNotification(
    newTask.id,
    staffId && !isAdmin ? staffId : null,
    projectId,
    newTask.title,
    isAdmin,
    newTask.type === "MODIFICATION"
  );
  if (project && project.assignments && isAdmin) {
    project.assignments.forEach(async (assignment) => {
      await newTaskCreatedNotification(
        newTask.id,
        assignment.userId,
        projectId,
        newTask.title,
        null,
        newTask.type === "MODIFICATION"
      );
    });
  }
  return newTask;
}

export async function updateTask({ data, taskId, isAdmin = false, userId }) {
  const oldTask = await prisma.task.findUnique({
    where: { id: Number(taskId) },
    select: {
      status: true,
    },
  });
  if (!isAdmin && oldTask.status === "DONE") {
    throw new Error("You can't change the task after DONE only admin can");
  }

  if (data.status && data.status === "DONE") {
    data.finishedAt = new Date();
  }
  data.updatedAt = new Date();
  const updatedTask = await prisma.task.update({
    where: { id: Number(taskId) },
    data,
  });

  const task = await prisma.task.findUnique({
    where: {
      id: Number(taskId),
    },
    select: {
      id: true,
      projectId: true,
      title: true,
    },
  });
  let project = null;
  if (task.projectId) {
    project = await prisma.project.findUnique({
      where: {
        id: Number(task.projectId),
      },
      select: {
        id: true,
        assignments: {
          select: {
            id: true,
            user: {
              select: {
                id: true,
              },
            },
          },
        },
      },
    });
  }
  await updateTaskNotification(
    task.id,
    userId && !isAdmin ? userId : null,
    task.projectId,
    task.title,
    isAdmin,
    task.type === "MODIFICATION"
  );
  if (project && project.assignments && isAdmin) {
    project.assignments.forEach(async (assignment) => {
      await updateTaskNotification(
        task.id,
        assignment.userId,
        task.projectId,
        task.title,
        false,
        task.type === "MODIFICATION"
      );
    });
  }
  return updatedTask;
}

export async function getTasksWithNotesIncluded({ searchParams }) {
  const where = {};
  if (searchParams.userId && searchParams.userId !== "null") {
    where.userId = Number(searchParams.userId);
  }
  if (searchParams.projectId) {
    where.projectId = Number(searchParams.projectId);
    delete where.userId;
  }
  if (searchParams.type) {
    where.type = searchParams.type;
  }
  if (searchParams.clientLeadId) {
    where.clientLeadId = Number(searchParams.clientLeadId);
  }
  const tasks = await prisma.task.findMany({
    where,
    include: {
      notes: true,
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
  return tasks;
}

export async function getTaskDetails({ searchParams, id }) {
  const taskId = Number(id);
  if (!searchParams.userId || searchParams.userId === "null") {
    return await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        notes: true,
        clientLead: {
          select: { id: true },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  const userId = Number(searchParams.userId);

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      notes: true,
      project: true,
      clientLead: {
        select: { id: true },
      },
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
  if (!task) {
    return null;
  }

  if (task.projectId) {
    const projectUser = await prisma.project.findFirst({
      where: {
        id: task.projectId,
      },
      select: {
        assignments: {
          select: { userId: true },
        },
      },
    });
    let passed = false;
    projectUser.assignments?.forEach((assignment) => {
      if (assignment.userId === Number(userId)) {
        passed = true;
        return;
      }
    });
    if (passed) {
      return task;
    }
  }

  throw new Error("You are not allowed to see this task");
}

export async function getArchivedProjects(searchParams, limit, skip) {
  const { groupProjects } = await import("./projectServices.js");
  const where = {
    projects: {
      some: {},
    },
  };
  const filters = JSON.parse(searchParams.filters);
  if (filters && filters !== "undefined" && filters.id) {
    where.id = Number(filters.id);
  }
  if (searchParams.id) {
    where.id = Number(searchParams.id);
  }

  if (searchParams.userId) {
    where.projects.some.assignments = {
      some: {
        userId: Number(searchParams.userId),
      },
    };
  }
  where.status = "ARCHIVED";

  const clientLeads = await prisma.clientLead.findMany({
    where,
    skip,
    take: limit,
    include: {
      projects: {
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
      },
    },
  });
  clientLeads.forEach((lead) => {
    const groupedProjects = groupProjects(lead.projects);
    lead.groupedProjects = groupedProjects;
  });

  const total = await prisma.clientLead.count({ where });
  return { data: clientLeads, total };
}
