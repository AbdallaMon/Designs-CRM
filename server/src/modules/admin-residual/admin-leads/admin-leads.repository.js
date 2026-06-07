// admin-residual/admin-leads repository — Prisma I/O ONLY (no business logic, no AppError).
// Only the admin `/new-lead` handler had its lead-create logic INLINE in the legacy route
// (there is no service fn to wrap), so its Prisma reads/writes live here. Every OTHER
// admin-lead operation (import/update/delete/telegram/client-update/commissions/fixed-data/
// projects) is a side-effecting legacy SERVICE fn and is invoked via a lazy adapter in the
// usecase — never duplicated here.
import prisma from "../../../infra/prisma/prisma.js";

export class AdminLeadsRepository {
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
}

export const adminLeadsRepository = new AdminLeadsRepository();
