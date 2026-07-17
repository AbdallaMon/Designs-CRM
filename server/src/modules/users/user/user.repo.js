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
import dayjs from "dayjs";
import { serializeJsonField, parseJsonField } from "../../../shared/utility/json-field.js";

// Roles that historically saw EVERY user in the directory/management lists (legacy
// `checkIfNotAdmin` branch — non-admins were narrowed to their own role group). Kept
// here as the single place the scope logic reads role facts; it only NARROWS a Prisma
// `where` (never grants by role alone — a permission code is still required at route).
const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN"];

// Match every user who HOLDS the requested role, from all three sources of truth.
//
// `userProfiles` is the authoritative one: a user may hold several profiles (e.g.
// DESIGNER_3D + DESIGNER_2D) and each carries its own `baseRole`, so a 2D project
// finds anyone holding a TWO_D_DESIGNER-based profile — and NOT 3D-only designers.
// Crucially this is independent of the user's ACTIVE profile: `User.role` is
// write-synced from whichever profile they are currently using (user.usecase.js
// updateUserProfiles), so matching on `role` alone made people appear/disappear from
// pickers merely by switching profile. The legacy `role`/`subRoles` clauses remain
// until those columns are retired.
//
// `exactRole` still drops the loose legacy subRole clause (so a designer carrying a
// vestigial STAFF subRole is not offered as a sales agent), but profile matches are
// never dropped: holding a NORMAL_SALES profile IS being a sales agent.
function matchClausesForRole(role, exactRole) {
  const clauses = [
    { role },
    { userProfiles: { some: { profile: { baseRole: role } } } },
  ];
  if (!exactRole) clauses.push({ subRoles: { some: { subRole: role } } });
  return clauses;
}

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
  // `exactRole` (opt-in) narrows the match to the PRIMARY `role` column only — dropping
  // the legacy subRole OR-clause. Because `UserSubRole.subRole` is itself a UserRole, the
  // default OR match pulls in users whose PRIMARY role differs but who carry the requested
  // role as a secondary subRole (e.g. a THREE_D_DESIGNER/TWO_D_EXECUTOR who also holds a
  // `STAFF` subRole). The lead-assign picker must list SALES agents ONLY, so it requests
  // `exactRole` to exclude designers/executors moonlighting with a STAFF subRole. The
  // chat/directory consumers do NOT pass it, so their behavior is preserved 1:1.
  async findDirectory({ searchParams, currentUser, checkIfNotHasRelatedChat = false, checkIfHasRelatedChat = false, exactRole = false }) {
    const params = { ...searchParams };
    if (!params.role) params.role = "STAFF";

    let where = {};
    if (params.role !== "all") {
      where.OR = matchClausesForRole(params.role, exactRole);
    }
    if (currentUser) {
      const checkIfNotAdmin = !ADMIN_ROLES.includes(currentUser.role);
      if (checkIfNotAdmin) {
        const user = await prisma.user.findUnique({
          where: { id: Number(currentUser.id) },
          include: { subRoles: true, userProfiles: { select: { profile: { select: { baseRole: true } } } } },
        });
        // The requester's own peer group: every role they HOLD — legacy base role,
        // legacy subRoles, and the baseRole of every profile assigned to them. The
        // ACTIVE profile is deliberately not used: it only reflects which hat they
        // happen to be wearing right now, not what they are.
        const groupUserRoleAndSubRoles = [
          ...new Set(
            [
              user.role,
              ...user.subRoles.map((r) => r.subRole),
              ...user.userProfiles.map((up) => up.profile?.baseRole),
            ].filter(Boolean),
          ),
        ];
        where.OR = groupUserRoleAndSubRoles.flatMap((role) =>
          matchClausesForRole(role, exactRole),
        );
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
      currentUser.currentProfileKey === "SUPER_SALES"
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

  // Persist the assigned permission profile (permission-profiles framework). Called
  // from the create/update usecases AFTER the frozen legacy create/edit write, only
  // when the caller sent a `profile` — single-field write, no business logic here.
  // `isPrimary`/`isSuperSales` are optionally included: the frozen legacy
  // createStaffUser/editStaffUser writes never persist those two flags (their Prisma
  // `data` is an explicit field list that omits them), so the usecase passes them here
  // to keep the columns in sync with the assigned profile.
  setUserProfile({ userId, profile, isPrimary, isSuperSales }) {
    const data = { profile };
    if (isPrimary !== undefined) data.isPrimary = isPrimary;
    if (isSuperSales !== undefined) data.isSuperSales = isSuperSales;
    return prisma.user.update({ where: { id: Number(userId) }, data });
  }

  // ── DB-relational profiles (admin assign/remove) ──────────────────────────────
  /** Assignable profiles for the admin picker (ordered). */
  listAssignableProfiles() {
    return prisma.profile.findMany({
      where: { isAssignable: true },
      orderBy: { sortOrder: "asc" },
      select: { id: true, key: true, label: true, family: true, baseRole: true },
    });
  }

  /** Resolve a set of profile ids to their key/baseRole (validate existence). */
  findProfilesByIds({ ids }) {
    return prisma.profile.findMany({
      where: { id: { in: ids.map(Number) } },
      select: { id: true, key: true, baseRole: true },
    });
  }

  /** The profile ids a user currently holds. */
  async getUserProfileIds({ userId }) {
    const rows = await prisma.userProfile.findMany({
      where: { userId: Number(userId) },
      select: { profileId: true },
    });
    return rows.map((r) => r.profileId);
  }

  /**
   * Diff-apply a user's assigned profiles + set the active one AND keep the legacy
   * role/flags/profile-string columns in sync with the current profile (rollback
   * safety) — all in one transaction.
   */
  async setUserProfiles({ userId, addIds, removeIds, currentProfileId, legacySync, assignedByUserId }) {
    const uid = Number(userId);
    const ops = [];
    for (const profileId of addIds) {
      ops.push(
        prisma.userProfile.upsert({
          where: { userId_profileId: { userId: uid, profileId } },
          update: { assignedByUserId },
          create: { userId: uid, profileId, assignedByUserId },
        }),
      );
    }
    if (removeIds.length) {
      ops.push(prisma.userProfile.deleteMany({ where: { userId: uid, profileId: { in: removeIds } } }));
    }
    ops.push(
      prisma.user.update({
        where: { id: uid },
        data: {
          currentProfileId,
          role: legacySync.role,
          isPrimary: legacySync.isPrimary,
          isSuperSales: legacySync.isSuperSales,
          profile: legacySync.profileKey,
        },
      }),
    );
    await prisma.$transaction(ops);
    return { userId: uid, added: addIds, removed: removeIds, currentProfileId };
  }

  // ── Restricted countries (legacy get/updateNotAllowedCountries) ───────────────
  async findRestrictedCountries({ userId }) {
    const user = await prisma.user.findUnique({
      where: { id: Number(userId) },
      select: { notAllowedCountries: true },
    });
    // notAllowedCountries is now a String? (LongText) JSON column — decode to the array.
    return parseJsonField(user?.notAllowedCountries) || [];
  }

  updateRestrictedCountries({ userId, countries }) {
    return prisma.user.update({
      where: { id: Number(userId) },
      // Serialize the country array to a JSON string for the String? (LongText) column.
      data: { notAllowedCountries: serializeJsonField(countries) },
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

  // ── Staff create/edit (relocated from the legacy admin-services god-file) ─────────
  // The password is hashed in the usecase (bcrypt) and passed in already-hashed; the repo
  // only writes. The `data`/`select` shapes are ported VERBATIM from the legacy
  // createStaffUser/editStaffUser.
  createStaffUser({ user, hashedPassword }) {
    return prisma.user.create({
      data: {
        email: user.email,
        password: hashedPassword,
        role: user.role,
        name: user.name,
        telegramUsername: user.telegramUsername,
      },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        lastSeenAt: true,
        role: true,
        subRoles: true,
        telegramUsername: true,
        maxLeadsCounts: true,
        maxLeadCountPerDay: true,
      },
    });
  }

  editStaffUser({ user, userId, hashedPassword }) {
    return prisma.user.update({
      where: { id: Number(userId) },
      data: {
        email: user.email && user.email,
        password: hashedPassword && hashedPassword,
        name: user.name,
        role: user.role && user.role,
        telegramUsername: user.telegramUsername,
      },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        lastSeenAt: true,
        role: true,
        subRoles: true,
        telegramUsername: true,
      },
    });
  }

  // ── User sub-roles (relocated verbatim from the legacy admin-services god-file) ───
  async updateUserRoles(userId, roles) {
    await prisma.UserSubRole.deleteMany({
      where: {
        userId: Number(userId),
        subRole: { in: roles.removed },
      },
    });
    let newRoles = roles.added.map((role) => ({
      userId: Number(userId),
      subRole: role,
    }));
    const superSales = newRoles.find((r) => r.subRole === "SUPER_SALES");
    const primarySales = newRoles.find((r) => r.subRole === "PRIMARY_SALES");
    if (superSales) {
      await prisma.user.update({
        where: { id: Number(userId) },
        data: { isSuperSales: true },
      });
      newRoles = newRoles.filter((r) => r.subRole === "PRIMARY_SALES");
    }
    if (primarySales) {
      await prisma.user.update({
        where: { id: Number(userId) },
        data: { isPrimary: true },
      });
      newRoles = newRoles.filter((r) => r.subRole === "SUPER_SALES");
    }
    if (superSales || primarySales) {
      newRoles.push({
        userId: Number(userId),
        subRole: "STAFF",
      });
    }
    return await prisma.UserSubRole.createMany({
      data: newRoles,
      skipDuplicates: true,
    });
  }

  // ── Auto-assignments write (relocated verbatim from the legacy god-file) ──────────
  async updateUserAutoAssignment(userId, assigments) {
    await prisma.autoAssignment.deleteMany({
      where: {
        userId: Number(userId),
        type: { in: assigments.removed },
      },
    });
    let newAssignMents = assigments.added.map((assigment) => ({
      userId: Number(userId),
      type: assigment,
    }));

    return await prisma.autoAssignment.createMany({
      data: newAssignMents,
      skipDuplicates: true,
    });
  }

  // ── Today's notifications for a staff member (relocated verbatim from the god-file) ─
  async getNotificationForTodayByStaffId(userId) {
    const where = {};
    where.staffId = Number(userId);
    const startOfToday = dayjs().startOf("day").toDate();
    const endOfToday = dayjs().endOf("day").toDate();
    where.createdAt = {
      gte: startOfToday,
      lte: endOfToday,
    };
    const notifications = await prisma.notification.findMany({
      where: where,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        staff: {
          select: {
            name: true,
          },
        },
        clientLead: {
          select: {
            location: true,
            projectType: true,
            projectStage: true,
            previousWork: true,
            hasArchitecturalPlan: true,
            serviceType: true,
            decisionMaker: true,
            bookingRequestStatus: true,
            bookingSubmittedAt: true,
            client: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    return notifications;
  }

  // ── Monthly user-log reads (backing getUserLogs; shaping lives in user.dto.js) ────
  findUserLastSeenById({ userId }) {
    return prisma.user.findUnique({
      where: { id: Number(userId) },
      select: {
        lastSeenAt: true,
      },
    });
  }

  findUserLogsInRange({ userId, startOfMonth, endOfMonth }) {
    return prisma.userLog.findMany({
      where: {
        userId: Number(userId),
        date: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      select: {
        id: true,
        date: true,
        totalMinutes: true,
        description: true,
      },
      orderBy: {
        date: "desc",
      },
    });
  }

  findUserLogForDay({ userId, date }) {
    return prisma.userLog.findFirst({
      where: {
        userId: Number(userId),
        date,
      },
      select: {
        totalMinutes: true,
      },
    });
  }

  // ── Minimal user lookup (legacy getUserDetailsWithSpecificFields) ──────────────
  // Ported VERBATIM (positional signature preserved) from the former
  // utilities/legacy/utility.js. Used by the notification-building infra helpers.
  getUserDetailsWithSpecificFields(id, fields = { id: true, name: true, email: true }) {
    return prisma.user.findUnique({
      where: { id: Number(id) },
      select: fields,
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
  // The profiles the user HOLDS — what they actually are, independent of the profile
  // they are currently signed in as. Pickers render the discipline from this.
  userProfiles: {
    select: { profile: { select: { id: true, key: true, label: true, baseRole: true } } },
  },
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
  profile: true,
  currentProfileId: true,
  userProfiles: { select: { profileId: true, profile: { select: { id: true, key: true, label: true } } } },
  telegramUsername: true,
};

export const userRepository = new UserRepository();
export { UserRepository };
