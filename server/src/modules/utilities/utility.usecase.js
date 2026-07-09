// utilities usecase — business logic / orchestration. Prisma NEVER appears here (only
// repo calls + a lazy legacy adapter for the cross-model search). Behavior is ported 1:1
// from the legacy handlers (routes/shared/utilities.js + routes/utility/utility.js) EXCEPT
// the two sanctioned security changes below.
//
// SECURITY (FIX 1 — user-log IDOR): legacy `submitUserLog`/`checkUserLog` took the subject
// `userId` from req.body / req.query — any authed user could forge or read another
// employee's work log (and `UserLog.@@unique([userId])` means a forged submit could even
// collide). Here the subject is ALWAYS `authUser.id` (self-scope, mirroring the
// notification fix). The client cannot select a target user. Admin-on-behalf-of is
// intentionally DROPPED from this endpoint — admin log access is owned by the users module
// (USER.VIEW_LOGS); we do NOT recreate an admin override here.
//
// SECURITY (FIX 2 — generic-model read passthrough): legacy `getImageSesssionModel` (`/`)
// and `getModelIds` (`/ids`) did `prisma[model].findMany()` while spreading client-supplied
// where/select/include — open mass-read + relation traversal + arbitrary columns. The
// usecase now (a) enforces UTILITY_MODEL_ALLOWLIST and throws MODEL_NOT_ALLOWED otherwise,
// and (b) routes the read through the repo with a FIXED server-side projection
// (UTILITY_MODEL_PROJECTIONS). The legacy builders are NO LONGER called.
import { AppError } from "../../shared/errors/AppError.js";
import {
  utilitiesMessagesCodes as C,
  UTILITY_MODEL_ALLOWLIST,
  UTILITY_MODEL_PROJECTIONS,
} from "@dms/shared";
import { utilityRepository } from "./utility.repo.js";

// The cross-model search (`searchData`) is now owned here (ported 1:1 from the former
// legacy/utility.js). Its Prisma I/O is delegated to the repo; the DI seam is retained so
// tests can still override the search implementation via the constructor.
const legacyDefaults = {
  searchData: (body, currentUser) => searchData(body, currentUser),
};

export class UtilityUsecase {
  /**
   * @param {import("./utility.repo.js").UtilityRepository} repository
   * @param {Partial<typeof legacyDefaults>} [legacy]
   */
  constructor(repository, legacy = {}) {
    this.repo = repository;
    this.legacy = { ...legacyDefaults, ...legacy };
  }

  // Reject any model not in the allow-list (the mass-read hardening). Returns the model's
  // fixed server-side projection on success — the ONLY columns/relations the caller may
  // read for that model (FIX 2). Never trusts a client `select`/`include`.
  #resolveModelProjection(model) {
    if (!UTILITY_MODEL_ALLOWLIST.includes(model) || !UTILITY_MODEL_PROJECTIONS[model]) {
      throw new AppError(C.MODEL_NOT_ALLOWED, 400);
    }
    return UTILITY_MODEL_PROJECTIONS[model];
  }

  // ── simple lookups ──────────────────────────────────────────────────────────────
  listFixedData() {
    return this.repo.listFixedData();
  }

  // GET /user-logs — self-scoped: does a log exist for the AUTHENTICATED user in range?
  // The subject is authUser.id, NEVER a client-supplied userId (FIX 1).
  checkUserLog({ query, authUser }) {
    return this.repo.userLogExists({
      userId: authUser.id,
      startTime: query.startTime,
      endTime: query.endTime,
    });
  }

  // POST /user-logs — self-scoped: creates the AUTHENTICATED user's log. The subject is
  // authUser.id, NEVER a client-supplied userId (FIX 1).
  async submitUserLog({ body, authUser }) {
    const log = await this.repo.createUserLog({
      userId: authUser.id,
      date: body.date,
      description: body.description,
      totalMinutes: body.totalMinutes,
    });
    return log;
  }

  getUserRole({ userId }) {
    return this.repo.getUserRole({ userId });
  }

  getOtherRoles({ userId }) {
    return this.repo.getOtherRoles({ userId });
  }

  getAdmins() {
    return this.repo.getAdmins();
  }

  getImages({ query }) {
    const toIdList = (csv) =>
      csv
        ? csv
            .split(",")
            .map((id) => Number(id))
            .filter(Boolean)
        : [];
    return this.repo.listImages({
      patternIdList: toIdList(query.patternIds),
      spaceIdList: toIdList(query.spaceIds),
    });
  }

  // ── generic model reads (allow-listed + fixed projection) ──────────────────────────
  // Both `/` and `/ids` now serve the SAME safe pick-list: id + the model's label field,
  // from a server-side projection. Client where/select/include are dropped (FIX 2). The
  // allow-list denial surfaces as a rejected promise (asyncHandler → error handler).
  async getModelData({ query }) {
    const select = this.#resolveModelProjection(query.model);
    return this.repo.findModelPickList({ model: query.model, select });
  }

  async getModelIds({ query }) {
    const select = this.#resolveModelProjection(query.model);
    return this.repo.findModelPickList({ model: query.model, select });
  }

  // ── cross-model search ────────────────────────────────────────────────────────────
  // Legacy passed the decoded token (getCurrentUser) as `currentUser`; req.auth carries
  // the same role/isSuperSales fields, so we pass it directly (no extra DB hit, no cookie
  // re-decode). The legacy searchData applies its own role-derived scoping.
  search({ query, authUser }) {
    return this.legacy.searchData(query, authUser);
  }
}

export const utilityUsecase = new UtilityUsecase(utilityRepository);

// ── cross-model search (ported VERBATIM from the former legacy/utility.js) ───────────
// Orchestration only: builds the role-derived `where`, then delegates every Prisma read
// to utilityRepository. All legacy branching/quirks are preserved 1:1.
function checkIsAllowedToSearchAll(user) {
  const adminRoles = ["ADMIN", "SUPER_ADMIN"];
  if (
    adminRoles.includes(user.role) ||
    user.isSuperSales ||
    (user.subRoles && user.subRoles.some((r) => adminRoles.includes(r.subRole)))
  ) {
    return true;
  }
}

export async function searchData(body, currentUser) {
  let { model, query, filters } = body;
  // Legacy captured `prismaModel = modelMap[model] || modelMap["user"]` from the ORIGINAL
  // model (only user/client/clientLead are real delegates; anything else → user), BEFORE
  // the reassignments below. Capture the equivalent delegate key here to preserve that.
  const delegateKey = ["user", "client", "clientLead"].includes(model)
    ? model
    : "user";
  const isSuperSales =
    currentUser.isSuperSales &&
    currentUser.role !== "ADMIN" &&
    currentUser.role !== "SUPER_ADMIN";
  let where = {};
  if (query) {
    if (model === "user") {
      where.OR = [
        { email: { contains: query } },
        { name: { contains: query } },
      ];
      where.role = "STAFF";
    } else if (model === "all-users") {
      model = "user";
    } else if (model === "client") {
      where.OR = [
        { email: { contains: query } },
        { name: { contains: query } },
        { phone: { contains: query } },
      ];
    } else if (model === "clientLead") {
      where.OR = [
        {
          client: {
            OR: [
              { email: { contains: query } },
              { name: { contains: query } },
              { phone: { contains: query } },
            ],
          },
        },
      ];
      const codeIdOr = {
        OR: [
          {
            code: {
              contains: query,
            },
          },
        ],
      };
      if (!isNaN(query)) {
        codeIdOr.OR.push({ id: { equals: Number(query) } });
        where.OR.push(codeIdOr);
      }
    } else {
      where.OR = [
        { email: { contains: query } },
        { name: { contains: query } },
      ];
      where.role = model.toUpperCase();
    }
  }
  if (filters && filters !== "undefined") {
    const parsedFilters = JSON.parse(filters);
    if (parsedFilters.role) {
      where.role = parsedFilters.role;
    }
    if (parsedFilters.OR) {
      where.OR = parsedFilters.OR;
    }
    if (parsedFilters.userId) {
      where.clientLeads = {
        some: {
          userId: Number(parsedFilters.userId),
        },
      };
    }
    if (
      parsedFilters.userRole === "STAFF" &&
      parsedFilters.staffId &&
      model === "clientLead"
    ) {
      const user = await utilityRepository.findUserForSearchScope({
        staffId: parsedFilters.staffId,
      });
      const isAllowedToSearchAll = checkIsAllowedToSearchAll(user);
      if (!isAllowedToSearchAll) {
        where.userId = Number(parsedFilters.staffId);
      }
    }
    if (
      (parsedFilters.userRole === "THREE_D_DESIGNER" ||
        parsedFilters.userRole === "TWO_D_DESIGNER") &&
      parsedFilters.staffId &&
      model === "clientLead"
    ) {
      where.projects = {
        some: {
          role: parsedFilters.userRole,
          assignments: {
            some: {
              userId: Number(parsedFilters.staffId),
            },
          },
        },
      };
    }
    if (parsedFilters.status) {
      where.status = parsedFilters.status;
    }
    if (
      parsedFilters.initialConsult ||
      parsedFilters.initialConsult === false
    ) {
      where.initialConsult = parsedFilters.initialConsult;
    }
  }
  if (where && where.role?.startsWith("3D")) {
    where.role = "THREE_D_DESIGNER";
  } else if (where && where.role?.startsWith("2D")) {
    where.role = "TWO_D_DESIGNER";
  }
  if (where.role) {
    const role = where.role;
    delete where.role;

    const roleOrSubRole = [
      { role: role },
      { subRoles: { some: { subRole: role } } },
    ];
    if (where.OR) {
      where.AND = [{ OR: where.OR }, { OR: roleOrSubRole }];
      delete where.OR;
    } else {
      where.OR = roleOrSubRole;
    }
  }
  if (model === "all-users-search") {
    model = "user";
    where.AND = where.AND[0];
  }
  if (isSuperSales && model === "user") {
    where.OR = [
      {
        role: "STAFF",
      },
      {
        subRoles: { some: { subRole: "STAFF" } },
      },
    ];
  }

  const selectFields = {
    user: {
      id: true,
      email: true,
      name: true,
      role: true,
    },
    client: {
      id: true,
      name: true,
      email: where.userId ? false : true,
      phone: where.userId ? false : true,
    },
    clientLead: {
      id: true,
      code: true,
      client: {
        select: {
          name: true,
          email: where.userId ? false : true,
          phone: where.userId ? false : true,
        },
      },
    },
  };
  const data = await utilityRepository.searchFindMany({
    delegateKey,
    where,
    select: selectFields[model] || selectFields["user"],
  });
  return data;
}
