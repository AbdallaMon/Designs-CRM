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
// The admin projects aggregation is decomposed into admin-projects.repo.js (Prisma) +
// admin-projects.dto.js (groupProjects shaping); the where-build stays here (module fn
// `getAdminProjects`, verbatim). createGroupProjects still wraps the FROZEN projects usecase.
import { adminProjectsRepository } from "./admin-projects.repo.js";
import { groupAdminProjects } from "./admin-projects.dto.js";
import { createGroupProjects } from "../../projects/project/project.usecase.js";

// Ported VERBATIM from the legacy `getAdminProjects` (where-build + read + shape + count).
export async function getAdminProjects(searchParams, limit, skip) {
  const where = {
    projects: {
      some: {}, // Means at least one related project exists
    },
  };
  const filters = JSON.parse(searchParams.filters);
  if (filters && filters !== "undefined" && filters.id) {
    where.id = Number(filters.id);
  }
  if (searchParams.id) {
    where.id = Number(searchParams.id);
  }
  where.status = {
    notIn: ["ARCHIVED", "NEW"],
  };
  const clientLeads = await adminProjectsRepository.findAdminProjects({
    where,
    skip,
    take: limit,
  });
  const data = groupAdminProjects(clientLeads);

  const total = await adminProjectsRepository.countAdminProjects({ where });
  return { data, total };
}

class AdminProjectsUsecase {
  listAdminProjects({ query, limit, skip }) {
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
    return getAdminProjects({ ...query, filters }, limit, skip);
  }

  // NOTE: the frozen service param is `clientleadId` (lowercase 'l') — a verbatim legacy
  // quirk, preserved.
  createProjectGroup({ clientLeadId, title }) {
    return createGroupProjects({ clientleadId: clientLeadId, title });
  }
}

export const adminProjectsUsecase = new AdminProjectsUsecase();
export { AdminProjectsUsecase };
