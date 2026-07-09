// admin-residual/reports repository — Prisma I/O ONLY (no business logic, no shaping). The
// reads backing the (NON-frozen) lead-report / staff-report DATA endpoints, ported VERBATIM
// (the `include`/`where` shapes) from the legacy `admin-services.js` god-file. The `where`
// is built by the usecase from the request filters and handed in; the summary/row shaping
// lives in reports.dto.js.
import prisma from "../../../infra/prisma/prisma.js";

export class ReportsRepository {
  // legacy generateLeadReport read
  findLeadsForReport({ where }) {
    return prisma.clientLead.findMany({
      where,
      include: {
        client: {
          select: {
            name: true,
            phone: true,
          },
        },
        assignedTo: {
          select: {
            name: true,
          },
        },
        priceOffers: {
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
          select: {
            minPrice: true,
            maxPrice: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  // legacy generateStaffReport read
  findStaffWithLeadsForReport({ where }) {
    return prisma.user.findMany({
      where: {
        role: "STAFF",
        isActive: true,
      },
      include: {
        clientLeads: {
          where,
        },
      },
    });
  }
}

export const reportsRepository = new ReportsRepository();
