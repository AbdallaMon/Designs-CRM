// admin-residual/fixed-data repository — Prisma I/O ONLY. The FixedData create/edit/delete
// writes are moved VERBATIM from the legacy `admin-services.js` god-file. The GET read lives
// in the already-migrated utilities module (unchanged); only these WRITES are residual.
import prisma from "../../../infra/prisma/prisma.js";

export class FixedDataRepository {
  createAFixedData({ data }) {
    return prisma.fixedData.create({
      data: {
        title: data.title,
        description: data.description || null,
      },
    });
  }

  editAFixedData({ id, data }) {
    return prisma.fixedData.update({
      where: { id },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
      },
    });
  }

  deleteAFixedData({ id }) {
    return prisma.fixedData.delete({
      where: { id },
    });
  }
}

export const fixedDataRepository = new FixedDataRepository();
