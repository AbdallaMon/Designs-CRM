import dayjs from "dayjs";
import prisma from "../../../prisma/prisma.js";

export const getNextCalls = async ({ limit, skip, searchParams }) => {
  const staffFilter =
    searchParams.staffId && searchParams.staffId !== "undefined"
      ? { userId: Number(searchParams.staffId) }
      : {};

  const nearestCallReminders = await prisma.callReminder.findMany({
    where: {
      status: "IN_PROGRESS",
      ...staffFilter,

      clientLead: {
        status: {
          notIn: ["CONVERTED", "ON_HOLD", "REJECTED"],
        },
        ...staffFilter,
      },
    },
    include: {
      clientLead: {
        select: {
          id: true,
          client: {
            select: {
              name: true,
            },
          },
          status: true,
        },
      },
    },
    orderBy: {
      time: "asc",
    },
    take: limit,
    skip: skip,
  });

  const total = await prisma.callReminder.count({
    where: {
      status: "IN_PROGRESS",
      clientLead: {
        status: {
          notIn: ["CONVERTED", "ON_HOLD", "FINALIZED", "REJECTED"],
        },
        ...staffFilter,
      },
    },
  });

  const totalPages = Math.ceil(total / limit);

  return {
    data: nearestCallReminders,
    limit,
    total,
    totalPages,
  };
};

export const getNextMeetings = async ({ limit, skip, searchParams }) => {
  const staffFilter =
    searchParams.staffId && searchParams.staffId !== "undefined"
      ? { userId: Number(searchParams.staffId) }
      : {};

  const nearestMeetingReminders = await prisma.meetingReminder.findMany({
    where: {
      status: "IN_PROGRESS",
      time: {
        not: null,
      },
      ...staffFilter,

      clientLead: {
        status: {
          notIn: ["CONVERTED", "ON_HOLD", "REJECTED"],
        },
        ...staffFilter,
      },
    },
    include: {
      clientLead: {
        select: {
          id: true,
          client: {
            select: {
              name: true,
            },
          },
          status: true,
        },
      },
    },
    orderBy: {
      time: "asc",
    },
    take: limit,
    skip: skip,
  });

  const total = await prisma.meetingReminder.count({
    where: {
      status: "IN_PROGRESS",
      clientLead: {
        status: {
          notIn: ["CONVERTED", "ON_HOLD", "FINALIZED", "REJECTED"],
        },
        ...staffFilter,
      },
    },
  });

  const totalPages = Math.ceil(total / limit);

  return {
    data: nearestMeetingReminders,
    limit,
    total,
    totalPages,
  };
};

export async function getAllFixedData() {
  return prisma.fixedData.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export async function getOtherRoles(userId) {
  const mainRole = await prisma.user.findUnique({
    where: {
      id: Number(userId),
    },
    select: {
      role: true,
    },
  });
  let subRoles = await prisma.UserSubRole.findMany({
    where: {
      userId: Number(userId),
    },
  });
  if (subRoles.length > 0) {
    subRoles = subRoles.map((subRole) => subRole.subRole);
  }
  return [...subRoles, mainRole.role];
}

export const checkUserLog = async (userId, startTime, endTime) => {
  const log = await prisma.userLog.findFirst({
    where: {
      userId: Number(userId),
      date: {
        gte: new Date(startTime),
        lte: new Date(endTime),
      },
    },
  });
  return !!log;
};

export const submitUserLog = async (
  userId,
  date,
  description,
  totalMinutes
) => {
  if (!description || !description.trim()) {
    throw new Error("Please enter a description");
  }
  const newLog = await prisma.userLog.create({
    data: {
      userId: Number(userId),
      date: new Date(date),
      description,
      totalMinutes,
    },
  });

  return { data: newLog, message: "response saved" };
};

export async function getUserRole(userId) {
  const user = await prisma.user.findUnique({
    where: {
      id: Number(userId),
    },
    select: {
      role: true,
    },
  });
  return user;
}

export async function updateAClientLeadUpdate(updateId) {
  return await prisma.clientLeadUpdate.update({
    where: {
      id: Number(updateId),
    },
    data: {
      updatedAt: new Date(),
    },
  });
}

export async function updateALead(leadId) {
  return await prisma.clientLead.update({
    where: {
      id: Number(leadId),
    },
    data: {
      updatedAt: new Date(),
    },
  });
}

export async function getClientLeadUpdate(updateId) {
  return await prisma.clientLeadUpdate.findUnique({
    where: {
      id: Number(updateId),
    },
    include: {
      sharedSettings: true,
    },
  });
}

export async function getImageSesssionModel({ model, searchParams }) {
  const data = await prisma[model].findMany();
  return data;
}

export async function getImages({ patternIds, spaceIds }) {
  const patternIdList = patternIds
    ? patternIds
        .split(",")
        .map((id) => Number(id))
        .filter(Boolean)
    : [];

  const spaceIdList = spaceIds
    ? spaceIds
        .split(",")
        .map((id) => Number(id))
        .filter(Boolean)
    : [];

  const where = {
    isArchived: false,
    ...(patternIdList.length > 0 && {
      patterns: {
        some: {
          id: { in: patternIdList },
        },
      },
    }),
    ...(spaceIdList.length > 0 && {
      spaces: {
        some: {
          id: { in: spaceIdList },
        },
      },
    }),
  };

  const images = await prisma.image.findMany({
    where,
    include: {
      patterns: true,
      spaces: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return images;
}

export async function getAdmins() {
  let where = {};
  where.OR = [
    {
      role: {
        in: ["ADMIN", "SUPER_ADMIN"],
      },
    },
    { subRoles: { some: { subRole: { in: ["ADMIN", "SUPER_ADMIN"] } } } },
  ];
  where.isActive = true;
  const users = await prisma.user.findMany({
    where: where,
    select: {
      id: true,
      name: true,
      email: true,
    },
  });

  return users;
}

export const todayRange = () => {
  const startOfToday = dayjs().startOf("day").toDate();
  const endOfToday = dayjs().endOf("day").toDate();
  return { startOfToday, endOfToday };
};
