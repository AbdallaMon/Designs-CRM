// admin-residual/admin-projects DTO — pure output shaping (no Prisma, no side effects).
// Attaches `groupedProjects` to each lead using the projects module's `groupProjects`
// (imported, not re-implemented). Moved VERBATIM from the legacy `admin-services.js`
// `getAdminProjects` forEach.
import { groupProjects } from "../../projects/project/project.dto.js";

export function groupAdminProjects(clientLeads) {
  clientLeads.forEach((lead) => {
    const groupedProjects = groupProjects(lead.projects);
    lead.groupedProjects = groupedProjects;
  });
  return clientLeads;
}
