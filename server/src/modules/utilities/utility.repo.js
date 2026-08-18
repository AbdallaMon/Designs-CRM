import prisma from "../../infra/prisma/prisma.js";

class UtilityRepository {
  listFixedData() {
    return prisma.fixedData.findMany({ orderBy: { createdAt: "desc" } });
  }

  async userLogExists({ userId, startTime, endTime }) {
    const log = await prisma.userLog.findFirst({
      where: {
        userId: Number(userId),
        date: { gte: new Date(startTime), lte: new Date(endTime) },
      },
    });
    return Boolean(log);
  }

  createUserLog({ userId, date, description, totalMinutes, client }) {
    const db = client ?? prisma;
    return db.userLog.create({
      data: {
        userId: Number(userId),
        date: new Date(date),
        description,
        totalMinutes,
      },
    });
  }

  getUserCurrentProfile({ userId }) {
    return prisma.user.findUnique({
      where: { id: Number(userId) },
      select: {
        currentProfile: {
          select: { id: true, key: true, label: true, family: true, isAdminTier: true },
        },
      },
    });
  }

  getAdmins() {
    return prisma.user.findMany({
      where: {
        isActive: true,
        currentProfile: { isAdminTier: true },
      },
      select: { id: true, name: true, email: true },
    });
  }

  listImages({ patternIdList, spaceIdList }) {
    const where = {
      isArchived: false,
      ...(patternIdList.length > 0 && {
        patterns: { some: { id: { in: patternIdList } } },
      }),
      ...(spaceIdList.length > 0 && {
        spaces: { some: { id: { in: spaceIdList } } },
      }),
    };
    return prisma.image.findMany({
      where,
      include: { patterns: true, spaces: true },
      orderBy: { createdAt: "desc" },
    });
  }

  findModelPickList({ model, select }) {
    return prisma[model].findMany({ select });
  }

  searchUsers({ query, profileKey }) {
    return prisma.user.findMany({
      where: {
        isActive: true,
        ...(profileKey ? { currentProfile: { key: profileKey } } : {}),
        OR: [
          { email: { contains: query } },
          { name: { contains: query } },
        ],
      },
      take: 20,
      select: {
        id: true,
        email: true,
        name: true,
        currentProfile: { select: { key: true, label: true, family: true } },
      },
    });
  }

  searchClients({ query, leadScope }) {
    return prisma.client.findMany({
      where: {
        ...(leadScope ? { clientLeads: { some: leadScope } } : {}),
        OR: [
          { email: { contains: query } },
          { name: { contains: query } },
          { phone: { contains: query } },
        ],
      },
      take: 20,
      select: { id: true, name: true, email: true, phone: true },
    });
  }

  searchLeads({ query, leadScope }) {
    const search = [
      {
        client: {
          OR: [
            { email: { contains: query } },
            { name: { contains: query } },
            { phone: { contains: query } },
          ],
        },
      },
      { code: { contains: query } },
    ];
    if (/^\d+$/.test(query)) search.push({ id: Number(query) });
    return prisma.clientLead.findMany({
      where: { AND: [leadScope, { OR: search }] },
      distinct: ["id"],
      take: 20,
      orderBy: { id: "desc" },
      select: {
        id: true,
        code: true,
        status: true,
        client: {
          select: { name: true, email: true, phone: true },
        },
      },
    });
  }
}

export const utilityRepository = new UtilityRepository();
export { UtilityRepository };
