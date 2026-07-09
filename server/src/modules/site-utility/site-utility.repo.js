// Prisma I/O ONLY. No business logic, no AppError. Methods accept an optional
// `client` so a usecase can compose them inside a prisma.$transaction.
import prisma from "../../infra/prisma/prisma.js";

// SiteUtility is a singleton row pinned to id = 1 (schema: `id Int @id @default(1)`).
const SITE_UTILITY_ID = 1;

export class SiteUtilityRepository {
  // ── PDF config (SiteUtility singleton) ─────────────────────────────────────
  getPdfConfig({ client } = {}) {
    return (client ?? prisma).siteUtility.findUnique({
      where: { id: SITE_UTILITY_ID },
    });
  }

  createPdfConfig({ data = {}, client } = {}) {
    return (client ?? prisma).siteUtility.create({
      data: { ...data, id: SITE_UTILITY_ID },
    });
  }

  updatePdfConfig({ data, client } = {}) {
    return (client ?? prisma).siteUtility.update({
      where: { id: SITE_UTILITY_ID },
      data,
    });
  }

  // ── Contract payment conditions ────────────────────────────────────────────
  listPaymentConditions({ client } = {}) {
    return (client ?? prisma).contractPaymentCondition.findMany({
      orderBy: { id: "asc" },
    });
  }

  countPaymentConditions({ client } = {}) {
    return (client ?? prisma).contractPaymentCondition.count();
  }

  getPaymentConditionById({ id, client } = {}) {
    return (client ?? prisma).contractPaymentCondition.findUnique({
      where: { id },
    });
  }

  createPaymentCondition({ data, client } = {}) {
    return (client ?? prisma).contractPaymentCondition.create({ data });
  }

  updatePaymentCondition({ id, data, client } = {}) {
    return (client ?? prisma).contractPaymentCondition.update({
      where: { id },
      data,
    });
  }

  deletePaymentCondition({ id, client } = {}) {
    return (client ?? prisma).contractPaymentCondition.delete({
      where: { id },
    });
  }

  // Used by the delete invariant: is this condition referenced by a payment?
  findFirstPaymentByConditionId({ conditionId, client } = {}) {
    return (client ?? prisma).contractPayment.findFirst({
      where: { conditionId },
      select: { id: true },
    });
  }
}

export const siteUtilityRepository = new SiteUtilityRepository();
