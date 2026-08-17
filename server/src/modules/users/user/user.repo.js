import {
  CHAT_ROOM_TYPES,
  PROFILE_FAMILIES,
  PROFILES,
} from "@dms/shared";
// User repository — Prisma I/O only.
import prisma from "../../../infra/prisma/prisma.js";
import dayjs from "dayjs";
import { serializeJsonField, parseJsonField } from "../../../shared/utility/json-field.js";

// Directory membership is based only on assigned profiles, independently of which
// assigned profile is currently active.
function matchProfile(profileKey) {
  return {
    userProfiles: { some: { profile: { key: profileKey } } },
  };
}

function requestedProfileKeys(value) {
  const values = Array.isArray(value) ? value : [value];
  return [
    ...new Set(
      values
        .flatMap((entry) => String(entry ?? "").split(","))
        .map((key) => key.trim())
        .filter(Boolean),
    ),
  ];
}

function managementScopeWhere(currentUser) {
  switch (currentUser?.currentProfileKey) {
    case PROFILES.ADMIN:
      return {};
    case PROFILES.SUPER_ADMIN:
      return { userProfiles: { none: { profile: { key: PROFILES.ADMIN } } } };
    case PROFILES.SUPER_SALES:
      return {
        AND: [
          {
            userProfiles: {
              some: { profile: { family: PROFILE_FAMILIES.SALES } },
            },
          },
          { userProfiles: { none: { profile: { isAdminTier: true } } } },
        ],
      };
    default:
      return { userProfiles: { none: { profile: { isAdminTier: true } } } };
  }
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

  findUserManagementScope({ userId }) {
    return prisma.user.findUnique({
      where: { id: Number(userId) },
      select: {
        id: true,
        userProfiles: {
          select: {
            profile: { select: { key: true, family: true, isAdminTier: true } },
          },
        },
      },
    });
  }

  // ── Directory ─────────────────────────────────────────────────────────────────
  //   checkIfNotHasRelatedChat → exclude users already in a STAFF_TO_STAFF room with me
  //   checkIfHasRelatedChat    → only users already in such a room with me
  async findDirectory({ searchParams, currentUser, checkIfNotHasRelatedChat = false, checkIfHasRelatedChat = false }) {
    const params = { ...searchParams };
    if (!params.profile) params.profile = PROFILES.NORMAL_SALES;

    let where = {};
    const profileKeys = requestedProfileKeys(params.profile);
    if (!profileKeys.includes("all")) {
      where.OR = profileKeys.map(matchProfile);
    }
    if (currentUser) {
      const hasSuperSalesScope = currentUser.currentProfileKey === PROFILES.SUPER_SALES;
      const checkIfNotAdmin = !currentUser.isAdminTier && !hasSuperSalesScope;
      if (hasSuperSalesScope) {
        const requestedScope = where.OR?.length ? { OR: where.OR } : null;
        where = {
          AND: [
            requestedScope,
          {
            userProfiles: {
              some: { profile: { family: PROFILE_FAMILIES.SALES } },
            },
          },
          ].filter(Boolean),
        };
      }
      if (checkIfNotAdmin) {
        const user = await prisma.user.findUnique({
          where: { id: Number(currentUser.id) },
          select: {
            userProfiles: {
              select: { profile: { select: { key: true } } },
            },
          },
        });
        // A non-admin directory is limited to the requester's assigned-profile peers.
        const heldProfileKeys = [
          ...new Set(
            user.userProfiles.map((up) => up.profile?.key).filter(Boolean),
          ),
        ];
        where.OR = heldProfileKeys.map(matchProfile);
      }
    }
    if (checkIfNotHasRelatedChat) {
      where.chatMemberships = {
        none: {
          room: {
            type: CHAT_ROOM_TYPES.STAFF_TO_STAFF,
            members: { some: { userId: Number(currentUser.id), isDeleted: false } },
          },
        },
      };
    }
    if (checkIfHasRelatedChat) {
      where.chatMemberships = {
        some: {
          room: {
            type: CHAT_ROOM_TYPES.STAFF_TO_STAFF,
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

  // ── Management list ───────────────────────────────────────────────────────────
  async findManagementList({ searchParams, currentUser, skip, take }) {
    const filters =
      searchParams.filters && typeof searchParams.filters === "string"
        ? JSON.parse(searchParams.filters)
        : searchParams.filters || {};
    const staffFilter = searchParams.staffId
      ? { userId: Number(searchParams.staffId) }
      : {};
    const where = { ...managementScopeWhere(currentUser), ...staffFilter };
    if (currentUser) {
      where.id = { not: Number(currentUser.id) };
    }
    if (filters.status !== undefined) {
      if (filters.status === "active") where.isActive = true;
      else if (filters.status === "banned") where.isActive = false;
    }
    if (filters && filters.userId) {
      where.AND = [...(Array.isArray(where.AND) ? where.AND : []), { id: Number(filters.userId) }];
    }
    const [users, total] = await Promise.all([
      prisma.user.findMany({ where, skip, take, select: MANAGEMENT_SELECT }),
      prisma.user.count({ where }),
    ]);
    return { users, total };
  }

  // ── Profile read ───────────────────────────────────────────────────────────────
  findUserProfileById({ userId }) {
    return prisma.user.findUnique({
      where: { id: Number(userId) },
      select: PROFILE_SELECT,
    });
  }

  // `data` is whitelisted in the usecase according to self/admin scope.
  updateUserProfile({ userId, data }) {
    return prisma.user.update({
      where: { id: Number(userId) },
      data,
      select: PROFILE_SELECT,
    });
  }

  // ── DB-relational profiles (admin assign/remove) ──────────────────────────────
  /** Assignable profiles for the admin picker (ordered). */
  listAssignableProfiles({ where = {} } = {}) {
    return prisma.profile.findMany({
      where: { isAssignable: true, ...where },
      orderBy: { sortOrder: "asc" },
      select: { id: true, key: true, label: true, family: true },
    });
  }

  /** Resolve a set of profile ids to their keys. */
  findProfilesByIds({ ids }) {
    return prisma.profile.findMany({
      where: { id: { in: ids.map(Number) } },
      select: { id: true, key: true },
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

  /** Diff-apply assigned profiles and set the active profile in one transaction. */
  async setUserProfiles({ userId, addIds, removeIds, currentProfileId, assignedByUserId }) {
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
        data: { currentProfileId },
      }),
    );
    await prisma.$transaction(ops);
    return { userId: uid, added: addIds, removed: removeIds, currentProfileId };
  }

  // ── Restricted countries ──────────────────────────────────────────────────────
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

  // ── Auto-assignments read ─────────────────────────────────────────────────────
  async findAutoAssignments({ userId }) {
    const assignments = await prisma.autoAssignment.findMany({
      where: { userId: Number(userId) },
    });
    return assignments.map((a) => a.type);
  }

  // ── Max leads ─────────────────────────────────────────────────────────────────
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

  // ── Status toggle ──────────────────────────────────────────────────────────────
  toggleStatus({ userId, isActive }) {
    return prisma.user.update({
      where: { id: Number(userId) },
      data: { isActive: !isActive },
      select: { id: true },
    });
  }

  // ── User create/edit ───────────────────────────────────────────────────────────
  // The password is hashed in the usecase (bcrypt) and passed in already-hashed; the repo
  // only writes.
  createUserRecord({ user, hashedPassword }) {
    return prisma.user.create({
      data: {
        email: user.email,
        password: hashedPassword,
        name: user.name,
        telegramUsername: user.telegramUsername,
      },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        lastSeenAt: true,
        telegramUsername: true,
        maxLeadsCounts: true,
        maxLeadCountPerDay: true,
      },
    });
  }

  updateUserRecord({ user, userId, hashedPassword }) {
    return prisma.user.update({
      where: { id: Number(userId) },
      data: {
        email: user.email && user.email,
        password: hashedPassword && hashedPassword,
        name: user.name,
        telegramUsername: user.telegramUsername,
      },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        lastSeenAt: true,
        telegramUsername: true,
      },
    });
  }

  // ── Auto-assignments write ─────────────────────────────────────────────────────
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

  // ── Minimal user lookup used by notification-building helpers ─────────────────
  getUserDetailsWithSpecificFields(id) {
    return prisma.user.findUnique({
      where: { id: Number(id) },
      select: { id: true, name: true, email: true },
    });
  }
}

// ── Selects ───────────────────────────────────────────────────────────────────────
const DIRECTORY_SELECT = {
  id: true,
  name: true,
  email: true,
  telegramUsername: true,
  profilePicture: true,
  currentProfile: {
    select: { id: true, key: true, label: true, family: true },
  },
  // The profiles the user HOLDS — what they actually are, independent of the profile
  // they are currently signed in as. Pickers render the discipline from this.
  userProfiles: {
    select: {
      profile: { select: { id: true, key: true, label: true, family: true } },
    },
  },
};

const MANAGEMENT_SELECT = {
  id: true,
  name: true,
  email: true,
  isActive: true,
  lastSeenAt: true,
  currentProfileId: true,
  currentProfile: {
    select: { id: true, key: true, label: true, family: true },
  },
  userProfiles: {
    select: {
      profileId: true,
      profile: { select: { id: true, key: true, label: true, family: true } },
    },
  },
  telegramUsername: true,
};

const PROFILE_SELECT = {
  id: true,
  name: true,
  email: true,
  isActive: true,
  lastSeenAt: true,
  telegramUsername: true,
  profilePicture: true,
  allowNotification: true,
  allowEmailing: true,
  googleEmail: true,
  maxLeadsCounts: true,
  maxLeadCountPerDay: true,
  currentProfileId: true,
  currentProfile: {
    select: { id: true, key: true, label: true, family: true },
  },
  userProfiles: {
    select: {
      profileId: true,
      profile: { select: { id: true, key: true, label: true, family: true } },
    },
  },
};

export const userRepository = new UserRepository();
export { UserRepository };
