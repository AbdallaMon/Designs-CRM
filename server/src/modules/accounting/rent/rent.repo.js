// accounting/rent repository — Prisma I/O ONLY. Relocated from the legacy accountant
// service. The list read + the create/renew writes (Rent + RentPeriod + linked Outcome) are
// raw Prisma; the required-fields / "Rent not found" guards and the multi-write orchestration
// live in rent.usecase.js, and the row-shaping lives in rent.dto.js. `findRentState` remains
// the minimal existence read the renew scope checker needs. Prisma model-accessor casing is
// kept exactly as the legacy service used it (behavior-preserving).
import prisma from "../../../infra/prisma/prisma.js";

// Select used by both the list read and the post-create re-read (legacy getRents / createARent).
const RENT_ROW_SELECT = {
  id: true,
  name: true,
  description: true,
  rentPeriods: {
    select: {
      amount: true,
      startDate: true,
      endDate: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 1,
  },
};

class RentRepository {
  model = prisma.rent;

  findRentState({ rentId }) {
    return prisma.rent.findUnique({
      where: { id: Number(rentId) },
      select: { id: true, name: true },
    });
  }

  findManyRents({ limit = 1, skip = 10 }) {
    return prisma.Rent.findMany({
      skip,
      take: limit,
      select: RENT_ROW_SELECT,
    });
  }

  countRents() {
    return prisma.Rent.count();
  }

  createRent({ name, description }) {
    return prisma.Rent.create({
      data: {
        name,
        description,
      },
    });
  }

  findRentRow({ id }) {
    return prisma.Rent.findUnique({
      where: { id },
      select: RENT_ROW_SELECT,
    });
  }

  findRentForRenew({ id }) {
    return prisma.Rent.findUnique({
      where: { id },
    });
  }

  createRentPeriod({ amount, rentId, startDate, endDate }) {
    return prisma.RentPeriod.create({
      data: {
        amount,
        rentId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isPaid: true,
      },
    });
  }

  createRentOutcome({ amount, name, paymentDate, rentPeriodId }) {
    return prisma.outcome.create({
      data: {
        amount,
        description: name || "Renewing rent",
        type: "RENT",
        createdAt: new Date(paymentDate),
        rentPeriods: {
          connect: {
            id: rentPeriodId,
          },
        },
      },
    });
  }
}

export const rentRepository = new RentRepository();
export { RentRepository };
