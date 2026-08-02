// admin-residual/admin-leads repository — Prisma I/O ONLY (no business logic, no AppError).
// Only the admin `/new-lead` handler had its lead-create logic INLINE in the legacy route
// (there is no service fn to wrap), so its Prisma reads/writes live here. Every OTHER
// admin-lead operation (import/update/delete/telegram/client-update/commissions/fixed-data/
// projects) is a side-effecting legacy SERVICE fn and is invoked via a lazy adapter in the
// usecase — never duplicated here.
import prisma from "../../../infra/prisma/prisma.js";

export class AdminLeadsRepository {
  // Multi-write transaction boundary owned by the repo (Prisma stays out of the usecase).
  // The usecase passes an orchestration callback; each repo call inside receives `client: tx`.
  runInTransaction(fn) {
    return prisma.$transaction(fn);
  }

  findClientByEmail({ email, client = prisma }) {
    return client.client.findUnique({ where: { email } });
  }

  createClient({ data, client = prisma }) {
    return client.client.create({ data });
  }

  updateClientPhone({ id, phone, client = prisma }) {
    return client.client.update({ where: { id: Number(id) }, data: { phone } });
  }

  createClientLead({ data, client = prisma }) {
    return client.clientLead.create({ data });
  }

  // ── excel bulk-import helpers (used by the createLeadFromExcelData orchestration) ──
  findLastClient({ client = prisma } = {}) {
    return client.client.findFirst({ orderBy: { id: "desc" } });
  }

  createNote({ data, client = prisma }) {
    return client.note.create({ data });
  }

  // ── generic single-field lead/client update (relocated VERBATIM from the god-file) ─
  async updateLeadField({ data, leadId }) {
    const type = data.inputType;
    delete data.inputType;
    const field = data.field;
    delete data.field;
    if (type === "date") {
      data[field] = new Date(data[field]);
    }
    console.log(data, "data");
    // if(field==="email"){

    // }
    try {
      const updatedLead = await prisma.clientLead.update({
        where: {
          id: Number(leadId),
        },
        data,
      });
      return updatedLead;
    } catch (e) {
      console.log(e, "e");

      throw e;
    }
  }

  async updateClientField({ data, clientId }) {
    if (data.inputType) {
      delete data.inputType;
    }
    if (data.field) {
      delete data.field;
    }
    try {
      const updatedClient = await prisma.client.update({
        where: {
          id: Number(clientId),
        },
        data,
      });
      return updatedClient;
    } catch (e) {
      throw e;
    }
  }

  // ── FK-aware transactional lead delete (relocated VERBATIM from the god-file) ──────
  async deleteALead(leadId) {
    const clientLeadId = Number(leadId);
    return await prisma.$transaction(async (prisma) => {
      try {
        // Find all associated records

        const clientLead = await prisma.clientLead.findUnique({
          where: { id: clientLeadId },
          include: {
            payments: true,
          },
        });

        if (!clientLead) {
          return null;
        }

        // Step 1: Handle Invoice dependencies first
        // Get all payments associated with this client lead
        const paymentIds = clientLead.payments.map((p) => p.id);

        if (paymentIds.length > 0) {
          // Find all invoices related to these payments
          const invoices = await prisma.invoice.findMany({
            where: { paymentId: { in: paymentIds } },
            include: { notes: true },
          });

          // Delete notes associated with invoices first
          for (const invoice of invoices) {
            if (invoice.notes && invoice.notes.length > 0) {
              await prisma.note.deleteMany({
                where: {
                  id: { in: invoice.notes.map((note) => note.id) },
                },
              });
            }
          }

          // Now delete all invoices
          await prisma.invoice.deleteMany({
            where: { paymentId: { in: paymentIds } },
          });
        }

        // Step 2: Delete all other related records

        // Delete notes related to various entities
        await prisma.note.deleteMany({
          where: { clientLeadId },
        });

        await prisma.task.deleteMany({ where: { clientLeadId } });
        await prisma.file.deleteMany({ where: { clientLeadId } });
        await prisma.notification.deleteMany({ where: { clientLeadId } });
        await prisma.callReminder.deleteMany({ where: { clientLeadId } });
        await prisma.extraService.deleteMany({ where: { clientLeadId } });
        await prisma.priceOffers.deleteMany({ where: { clientLeadId } });
        await prisma.availableSlot.updateMany({
          where: { meetingReminder: { clientLeadId } },
          data: { meetingReminderId: null },
        });
        await prisma.deliverySchedule.deleteMany({
          where: { project: { clientLeadId } },
        });
        await prisma.assignment.deleteMany({
          where: { project: { clientLeadId } },
        });
        await prisma.telegramChannel.deleteMany({
          where: { clientLeadId },
        });
        await prisma.meetingReminder.deleteMany({ where: { clientLeadId } });
        await prisma.contract.deleteMany({ where: { clientLeadId } });
        await prisma.note.deleteMany({
          where: {
            clientImageSession: {
              clientLeadId,
            },
          },
        });
        await prisma.note.deleteMany({
          where: {
            clientSelectedImage: {
              imageSession: {
                clientLeadId,
              },
            },
          },
        });
        await prisma.clientSelectedImage.deleteMany({
          where: {
            imageSession: {
              clientLeadId,
            },
          },
        });
        await prisma.clientImageSession.deleteMany({ where: { clientLeadId } });
        await prisma.versaModel.deleteMany({ where: { clientLeadId } });
        await prisma.sessionQuestion.deleteMany({ where: { clientLeadId } });
        await prisma.note.deleteMany({
          where: {
            salesStage: {
              clientLeadId,
            },
          },
        });
        await prisma.salesStage.deleteMany({ where: { clientLeadId } });
        await prisma.note.deleteMany({
          where: {
            update: {
              clientLeadId,
            },
          },
        });
        await prisma.note.deleteMany({
          where: {
            sharedUpdate: {
              update: {
                clientLeadId,
              },
            },
          },
        });
        await prisma.sharedUpdate.deleteMany({
          where: {
            update: { clientLeadId },
          },
        });
        await prisma.clientLeadUpdate.deleteMany({ where: { clientLeadId } });
        await prisma.note.deleteMany({
          where: {
            commission: {
              leadId: clientLeadId,
            },
          },
        });
        await prisma.commission.deleteMany({ where: { leadId: clientLeadId } });
        // Delete projects
        await prisma.project.deleteMany({ where: { clientLeadId } });

        // Now it's safe to delete payments
        await prisma.payment.deleteMany({ where: { clientLeadId } });
        await prisma.fetchedTelegramMessage.deleteMany({
          where: { clientLeadId },
        });

        // Finally, delete the ClientLead
        return await prisma.clientLead.delete({
          where: { id: clientLeadId },
        });
      } catch (error) {
        console.error("Error in transaction:", error);
        throw error; // Re-throw to let the transaction fail
      }
    });
  }

  // ── telegram: read the lead + its project users (write stays in the usecase) ──────
  findLeadForTelegram({ clientLeadId }) {
    return prisma.clientLead.findUnique({
      where: { id: Number(clientLeadId) },
      include: {
        assignedTo: true,
        projects: {
          include: {
            assignments: {
              include: {
                user: true,
              },
            },
          },
        },
        telegramChannel: true,
      },
    });
  }
}

export const adminLeadsRepository = new AdminLeadsRepository();
