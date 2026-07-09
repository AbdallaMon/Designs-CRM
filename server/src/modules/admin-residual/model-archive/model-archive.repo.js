// admin-residual/model-archive repository — Prisma I/O ONLY. The generic archive-by-model
// write is moved VERBATIM from the legacy `admin-services.js` god-file. The client-supplied
// `model` name is validated against the allow-list in the usecase BEFORE it reaches here, so
// the `prisma[model]` delegate access is always a sanctioned reference-data table.
import prisma from "../../../infra/prisma/prisma.js";

export class ModelArchiveRepository {
  toggleArchiveAModel({ model, isArchived, id }) {
    return prisma[model].update({
      where: {
        id: Number(id),
      },
      data: {
        isArchived,
      },
    });
  }
}

export const modelArchiveRepository = new ModelArchiveRepository();
