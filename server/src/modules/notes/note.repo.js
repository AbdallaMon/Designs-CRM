// notes repository — Prisma I/O ONLY (no business rules, no side effects). Relocated
// verbatim from the legacy `shared/legacy/note-services.js` Prisma calls. This is the shared
// notes home reached by the client-portal notes surface and the projects/task notes helpers
// through the note usecase's module functions. Selects/filters are preserved 1:1.
import prisma from "../../infra/prisma/prisma.js";

class NoteRepository {
  // Notes attached to the owner named by `idKey` (legacy getNotes select).
  findNotesByOwner({ idKey, id }) {
    return prisma.note.findMany({
      where: {
        [idKey]: Number(id),
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        content: true,
        createdAt: true,
        attachment: true,
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  findAdminUser() {
    return prisma.user.findFirst({
      where: {
        isActive: true,
        currentProfile: { isAdminTier: true },
      },
      select: {
        id: true,
      },
    });
  }

  createNote({ data }) {
    return prisma.note.create({ data });
  }

  // Re-read the created note with its user (legacy addNote post-create fetch).
  findNoteWithUser({ id }) {
    return prisma.note.findUnique({
      where: {
        id: Number(id),
      },
      include: {
        user: true,
      },
    });
  }

  // Owning clientLeadId of an update (legacy addNote updateId branch).
  findUpdateLeadId({ updateId }) {
    return prisma.clientLeadUpdate.findUnique({
      where: {
        id: Number(updateId),
      },
      select: {
        clientLeadId: true,
      },
    });
  }

  // Note createdAt (legacy deleteNote guard read).
  findNoteCreatedAt({ id }) {
    return prisma.note.findUnique({
      where: {
        id: Number(id),
      },
      select: {
        createdAt: true,
        userId: true,
        clientLeadId: true,
        baseEmployeeSalaryId: true,
        rentId: true,
        rentPeriodId: true,
        operationalExpensesId: true,
        paymentId: true,
        invoiceId: true,
        taskId: true,
        commissionId: true,
        updateId: true,
        sharedUpdateId: true,
        imageSessionId: true,
        selectedImageId: true,
        contractId: true,
        salesStageId: true,
        deliveryScheduleId: true,
        notedUserId: true,
      },
    });
  }

  async resolveTarget({ idKey, id }) {
    const targetId = Number(id);
    switch (idKey) {
      case "clientLeadId":
        return prisma.clientLead.findUnique({
          where: { id: targetId },
          select: { id: true },
        }).then((row) => row && ({ kind: "lead", clientLeadId: row.id }));
      case "commissionId":
        return prisma.commission.findUnique({
          where: { id: targetId },
          select: { leadId: true },
        }).then((row) => row && ({ kind: "lead", clientLeadId: row.leadId }));
      case "updateId":
        return prisma.clientLeadUpdate.findUnique({
          where: { id: targetId },
          select: { clientLeadId: true },
        }).then((row) => row && ({ kind: "lead", clientLeadId: row.clientLeadId }));
      case "sharedUpdateId":
        return prisma.sharedUpdate.findUnique({
          where: { id: targetId },
          select: { update: { select: { clientLeadId: true } } },
        }).then((row) => row && ({ kind: "lead", clientLeadId: row.update.clientLeadId }));
      case "imageSessionId":
        return prisma.clientImageSession.findUnique({
          where: { id: targetId },
          select: { clientLeadId: true },
        }).then((row) => row && ({ kind: "lead", clientLeadId: row.clientLeadId }));
      case "selectedImageId":
        return prisma.clientSelectedImage.findUnique({
          where: { id: targetId },
          select: { imageSession: { select: { clientLeadId: true } } },
        }).then((row) => row && ({ kind: "lead", clientLeadId: row.imageSession.clientLeadId }));
      case "contractId":
        return prisma.contract.findUnique({
          where: { id: targetId },
          select: { clientLeadId: true },
        }).then((row) => row && ({ kind: "lead", clientLeadId: row.clientLeadId }));
      case "salesStageId":
        return prisma.salesStage.findUnique({
          where: { id: targetId },
          select: { clientLeadId: true },
        }).then((row) => row && ({ kind: "lead", clientLeadId: row.clientLeadId }));
      case "taskId":
        return prisma.task.findUnique({
          where: { id: targetId },
          select: { projectId: true, clientLeadId: true },
        }).then((row) =>
          row && ({
            kind: row.projectId ? "project" : "lead",
            projectId: row.projectId,
            clientLeadId: row.clientLeadId,
          }),
        );
      case "deliveryScheduleId":
        return prisma.deliverySchedule.findUnique({
          where: { id: targetId },
          select: { projectId: true },
        }).then((row) => row && ({ kind: "project", projectId: row.projectId }));
      case "paymentId":
        return prisma.payment.findUnique({
          where: { id: targetId },
          select: { id: true },
        }).then((row) => row && ({ kind: "accounting" }));
      case "invoiceId":
        return prisma.invoice.findUnique({
          where: { id: targetId },
          select: { id: true },
        }).then((row) => row && ({ kind: "accounting" }));
      case "baseEmployeeSalaryId":
        return prisma.baseEmployeeSalary.findUnique({
          where: { id: targetId },
          select: { id: true },
        }).then((row) => row && ({ kind: "accounting" }));
      case "rentId":
        return prisma.rent.findUnique({
          where: { id: targetId },
          select: { id: true },
        }).then((row) => row && ({ kind: "accounting" }));
      case "rentPeriodId":
        return prisma.rentPeriod.findUnique({
          where: { id: targetId },
          select: { id: true },
        }).then((row) => row && ({ kind: "accounting" }));
      case "operationalExpensesId":
        return prisma.operationalExpenses.findUnique({
          where: { id: targetId },
          select: { id: true },
        }).then((row) => row && ({ kind: "accounting" }));
      case "notedUserId":
        return prisma.user.findUnique({
          where: { id: targetId },
          select: { id: true },
        }).then((row) => row && ({ kind: "user", userId: row.id }));
      default:
        return null;
    }
  }

  deleteNote({ id }) {
    return prisma.note.delete({
      where: {
        id: Number(id),
      },
    });
  }
}

export const noteRepository = new NoteRepository();
export { NoteRepository };
