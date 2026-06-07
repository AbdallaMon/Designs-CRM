// admin-residual/admin-projects usecase — orchestration only.
//
// OVERLAP FINDING (reported): the v2 projects module does NOT expose either of these.
//   - `GET /admin/projects` (`getAdminProjects`) is a GLOBAL admin aggregation of ALL
//     leads that HAVE projects (status notIn ARCHIVED/NEW), with their project assignments
//     — there is no `clientLeadId` filter. The projects module's `GET /v2/projects` is
//     scoped to a SPECIFIC `?clientLeadId=` (object-scoped on that one lead). Different
//     surface → migrated here as an admin-specific aggregation.
//   - `POST /admin/projects/create-group` (`createGroupProjects`) has no equivalent in the
//     projects module either. Migrated here.
// Both wrap the FROZEN `services/main/shared/projectServices.js` + admin service via lazy
// adapters (heavy Prisma + project-group creation) — no duplication.
const legacyDefaults = {
  getAdminProjects: (searchParams, limit, skip) =>
    import("../../../../services/main/admin/adminServices.js").then((m) =>
      m.getAdminProjects(searchParams, limit, skip),
    ),
  createGroupProjects: (a) =>
    import("../../../../services/main/shared/projectServices.js").then((m) => m.createGroupProjects(a)),
};

export class AdminProjectsUsecase {
  constructor(legacy = {}) {
    this.legacy = { ...legacyDefaults, ...legacy };
  }

  list({ query, limit, skip }) {
    // The frozen `getAdminProjects` does `JSON.parse(searchParams.filters)` unconditionally
    // → a missing/malformed `filters` would 500. Normalize to a valid JSON string here
    // (defaulting to "{}") without altering the frozen filter logic.
    const filters = (() => {
      try {
        return JSON.stringify(query.filters ? JSON.parse(query.filters) : {});
      } catch {
        return "{}";
      }
    })();
    return this.legacy.getAdminProjects({ ...query, filters }, limit, skip);
  }

  // NOTE: the frozen service param is `clientleadId` (lowercase 'l') — a verbatim legacy
  // quirk, preserved.
  createGroup({ clientLeadId, title }) {
    return this.legacy.createGroupProjects({ clientleadId: clientLeadId, title });
  }
}

export const adminProjectsUsecase = new AdminProjectsUsecase();
