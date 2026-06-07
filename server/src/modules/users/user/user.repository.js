// users/user repository — Prisma I/O ONLY (no business rules, no AppError). The simple
// reads + single-field writes are ported VERBATIM (selects/filters) from the legacy
// services so observable shapes are preserved 1:1:
//   - getAllUsers (directory)        services/main/admin/adminServices.js
//   - getUser (management list)        ″
//   - getUserById / getUserProfileById (profile read)
//   - getNotAllowedCountries / updateNotAllowedCountries
//   - getAutoAssignmentsForAUser
//   - updateUserMaxLeads / updateUserMaxLeadsPerDay
//   - changeUserStatus / toggleExtraStaffField
//   - getUserProfileOwner (NEW — minimal id lookup for the profile scope checker)
// The heavy / multi-write / side-effecting operations (createStaffUser + bcrypt,
// editStaffUser + bcrypt, updateUserRoles, updateUserAutoAssignment, getUserLogs date
// aggregation, getNotificationForTodayByStaffId) stay in the not-yet-migrated services
// and are invoked from the usecase via lazy imports — exactly the leads/courses pattern
// — so behavior is preserved 1:1 without duplicating it.
import prisma from "../../../infra/prisma/prisma.js";

// Roles that historically saw EVERY user in the directory/management lists (legacy
// `checkIfNotAdmin` branch — non-admins were narrowed to their own role group). Kept
// here as the single place the scope logic reads role facts; it only NARROWS a Prisma
// `where` (never grants by role alone — a permission code is still required at route).
const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN"];

class UserRepository {
  model = prisma.user;

  // ── Profile scope checker support (the IDOR fix) ──────────────────────────────
  // Minimal lookup so the usecase can confirm the target profile exists and learn its
  // id before deciding self-vs-admin. Never leaks sensitive fields.
  findUserIdById({ userId }) {
    return prisma.user.findUnique({
      where: { id: Number(userId) },
      select: { id: true },
    });
  }

  // ── Directory (legacy getAllUsers) — ported VERBATIM ──────────────────────────
  // Flags mirror the legacy 4th/3rd args:
  //   checkIfNotHasRelatedChat → exclude users already in a STAFF_TO_STAFF room with me
  //   checkIfHasRelatedChat    → only users already in such a room with me
  async findDirectory({ searchParams, currentUser, checkIfNotHasRelatedChat = false, checkIfHasRelatedChat = false }) {
    const params = { ...searchParams };
    if (!params.role) params.role = "STAFF";

    let where = {};
    if (params.role !== "all") {
      where.OR = [
        { role: params.role },
        { subRoles: { some: { subRole: params.role } } },
      ];
    }
    if (currentUser) {
      const checkIfNotAdmin = !ADMIN_ROLES.includes(currentUser.role);
      if (checkIfNotAdmin) {
        const user = await prisma.user.findUnique({
          where: { id: Number(currentUser.id) },
          include: { subRoles: true },
        });
        const groupUserRoleAndSubRoles = [
          user.role,
          ...user.subRoles.map((r) => r.subRole),
        ];
        where.OR = [];
        for (const role of groupUserRoleAndSubRoles) {
          where.OR.push(
            { role: role },
            { subRoles: { some: { subRole: role } } },
          );
        }
      }
    }
    if (checkIfNotHasRelatedChat) {
      where.chatMemberships = {
        none: {
          room: {
            type: "STAFF_TO_STAFF",
            members: { some: { userId: Number(currentUser.id), isDeleted: false } },
          },
        },
      };
    }
    if (checkIfHasRelatedChat) {
      where.chatMemberships = {
        some: {
          room: {
            type: "STAFF_TO_STAFF",
            members: { some: { userId: Number(currentUser.id), isDeleted: false } },
          },
        },
      };
    }
    // not me
    where.id = { not: Number(currentUser.id) };
    where.isActive = true;

    return prisma.user.findMany({ where, select: DIRECTORY_SELECT });
  }

  // ── Management list (legacy getUser) — ported VERBATIM (incl. the count) ──────
  async findManagementList({ searchParams, currentUser, skip, take }) {
    const filters =
      searchParams.filters && typeof searchParams.filters === "string"
        ? JSON.parse(searchParams.filters)
        : searchParams.filters || {};
    const staffFilter = searchParams.staffId
      ? { userId: Number(searchParams.staffId) }
      : {};
    let where = { role: { not: "ADMIN" }, ...staffFilter };
    if (currentUser) {
      where.id = { not: Number(currentUser.id) };
      where.role = { notIn: ["SUPER_ADMIN", "ADMIN"] };
    }
    if (filters.status !== undefined) {
      if (filters.status === "active") where.isActive = true;
      else if (filters.status === "banned") where.isActive = false;
    }
    if (filters && filters.userId) where.id = Number(filters.userId);
    if (
      currentUser.role !== "ADMIN" &&
      currentUser.role !== "SUPER_ADMIN" &&
      currentUser.isSuperSales
    ) {
      where.OR = [
        { role: "STAFF" },
        { subRoles: { some: { subRole: "STAFF" } } },
      ];
    }
    const [users, total] = await Promise.all([
      prisma.user.findMany({ where, skip, take, select: MANAGEMENT_SELECT }),
      prisma.user.count({ where }),
    ]);
    return { users, total };
  }

  // ── Profile read (legacy getUserProfileById) ──────────────────────────────────
  // Self/admin profile view (legacy getUserProfileById: full row — the usecase/dto
  // strips sensitive fields before it leaves the server).
  findUserProfileById({ userId }) {
    // Include subRoles to match the legacy admin profile read (getUserById:
    // include { subRoles: true }). The FE admin profile (UserProfile.jsx) reads
    // `user.subRoles` to render the role controls; without this the controls vanish
    // at cutover. subRoles is safe to expose (it was in the legacy admin response);
    // toSafeProfile still strips the password.
    return prisma.user.findUnique({
      where: { id: Number(userId) },
      include: { subRoles: true },
    });
  }

  // Self-service profile update (legacy updateUserProfileById). `data` is whitelisted
  // in the usecase for non-admin callers.
  updateUserProfile({ userId, data }) {
    return prisma.user.update({ where: { id: Number(userId) }, data });
  }

  // ── Restricted countries (legacy get/updateNotAllowedCountries) ───────────────
  async findRestrictedCountries({ userId }) {
    const user = await prisma.user.findUnique({
      where: { id: Number(userId) },
      select: { notAllowedCountries: true },
    });
    return user?.notAllowedCountries || [];
  }

  updateRestrictedCountries({ userId, countries }) {
    return prisma.user.update({
      where: { id: Number(userId) },
      data: { notAllowedCountries: countries },
    });
  }

  // ── Auto-assignments read (legacy getAutoAssignmentsForAUser) ─────────────────
  async findAutoAssignments({ userId }) {
    const assignments = await prisma.autoAssignment.findMany({
      where: { userId: Number(userId) },
    });
    return assignments.map((a) => a.type);
  }

  // ── Max leads (legacy updateUserMaxLeads / updateUserMaxLeadsPerDay) ──────────
  updateMaxLeads({ userId, maxLeadsCounts }) {
    return prisma.user.update({
      where: { id: Number(userId) },
      data: { maxLeadsCounts: Number(maxLeadsCounts) },
    });
  }

  updateMaxLeadsPerDay({ userId, maxLeadCountPerDay }) {
    return prisma.user.update({
      where: { id: Number(userId) },
      data: { maxLeadCountPerDay: Number(maxLeadCountPerDay) },
    });
  }

  // ── Status toggle / staff-extra (legacy changeUserStatus / toggleExtraStaffField) ─
  toggleStatus({ userId, isActive }) {
    return prisma.user.update({
      where: { id: Number(userId) },
      data: { isActive: !isActive },
      select: { id: true },
    });
  }

  toggleStaffExtra({ userId, data }) {
    return prisma.user.update({
      where: { id: Number(userId) },
      data,
      select: { id: true },
    });
  }
}

// ── Selects (verbatim from legacy) ───────────────────────────────────────────────
const DIRECTORY_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  subRoles: true,
  isPrimary: true,
  isSuperSales: true,
  telegramUsername: true,
  profilePicture: true,
};

const MANAGEMENT_SELECT = {
  id: true,
  name: true,
  email: true,
  isActive: true,
  lastSeenAt: true,
  role: true,
  subRoles: true,
  isPrimary: true,
  isSuperSales: true,
  telegramUsername: true,
};

export const userRepository = new UserRepository();
export { UserRepository };
