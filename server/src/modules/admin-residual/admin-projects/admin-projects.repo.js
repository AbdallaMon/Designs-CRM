// admin-residual/admin-projects repository — Prisma I/O ONLY. The admin projects aggregation
// read + count are moved VERBATIM (the `include` shape) from the legacy `admin-services.js`
// god-file. The `where` is built by the usecase and handed in; the groupProjects shaping
// lives in admin-projects.dto.js.
import prisma from "../../../infra/prisma/prisma.js";

export class AdminProjectsRepository {
  findAdminProjects({ where, skip, take }) {
    return prisma.clientLead.findMany({
      where,
      skip,
      take,
      include: {
        projects: {
          include: {
            assignments: {
              select: {
                id: true,
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  countAdminProjects({ where }) {
    return prisma.clientLead.count({ where });
  }
}

export const adminProjectsRepository = new AdminProjectsRepository();
