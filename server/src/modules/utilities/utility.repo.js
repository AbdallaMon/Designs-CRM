// utilities repository — Prisma I/O ONLY (no business rules, no AppError).
//
// The simple lookup reads (fixed-data, user logs, user role, admins, images, other-roles)
// are ported here as clean Prisma. The cross-model `searchData` (role-derived filters)
// stays in the legacy service (invoked from the usecase via a lazy adapter).
//
// SECURITY (FIX 2): the generic pick-list reads (`/` and `/ids`) are now done HERE with a
// FIXED server-side projection (UTILITY_MODEL_PROJECTIONS), NOT via the legacy
// `getModelIds`/`getImageSesssionModel` builders which spread client-supplied
// where/select/include into Prisma. The model name + projection are validated/looked up in
// the usecase against the allow-list before this method is ever reached.
import prisma from "../../infra/prisma/prisma.js";

class UtilityRepository {
  // GET /fixed-data
  listFixedData() {
    return prisma.fixedData.findMany({ orderBy: { createdAt: "desc" } });
  }

  // GET /user-logs — does a log exist for this user in [startTime, endTime]?
  async userLogExists({ userId, startTime, endTime }) {
    const log = await prisma.userLog.findFirst({
      where: {
        userId: Number(userId),
        date: { gte: new Date(startTime), lte: new Date(endTime) },
      },
    });
    return !!log;
  }

  // POST /user-logs
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

  // GET /users/role/:userId
  getUserRole({ userId }) {
    return prisma.user.findUnique({
      where: { id: Number(userId) },
      select: { role: true },
    });
  }

  // GET /roles — base role + sub-roles for a user
  async getOtherRoles({ userId }) {
    const mainRole = await prisma.user.findUnique({
      where: { id: Number(userId) },
      select: { role: true },
    });
    let subRoles = await prisma.userSubRole.findMany({
      where: { userId: Number(userId) },
      select: { subRole: true },
    });
    const subRoleNames = subRoles.map((s) => s.subRole);
    return [...subRoleNames, ...(mainRole ? [mainRole.role] : [])];
  }

  // GET /users/admins — active ADMIN/SUPER_ADMIN (base or sub-role)
  getAdmins() {
    return prisma.user.findMany({
      where: {
        isActive: true,
        OR: [
          { role: { in: ["ADMIN", "SUPER_ADMIN"] } },
          { subRoles: { some: { subRole: { in: ["ADMIN", "SUPER_ADMIN"] } } } },
        ],
      },
      select: { id: true, name: true, email: true },
    });
  }

  // GET /images — by pattern/space id lists
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

  // GET / and GET /ids — generic pick-list read with a FIXED server-side projection.
  // `model` is an allow-listed Prisma delegate name and `select` is the fixed projection
  // from UTILITY_MODEL_PROJECTIONS — both resolved in the usecase. NO client-supplied
  // where/select/include reaches Prisma (FIX 2). A small server-side `where` (e.g.
  // active-only) may be baked here per model if ever needed; today there is none, matching
  // the legacy default of returning all rows.
  findModelPickList({ model, select }) {
    return prisma[model].findMany({ select });
  }
}

export const utilityRepository = new UtilityRepository();
export { UtilityRepository };
