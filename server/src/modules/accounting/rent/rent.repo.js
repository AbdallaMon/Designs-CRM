// accounting/rent repository — Prisma I/O ONLY. The renew/create logic (which writes a
// RentPeriod + a linked Outcome) lives in the not-yet-migrated accountant service and is
// invoked from the usecase via lazy adapters. The only direct Prisma here is the minimal
// existence read the renew guard needs (confirm the rent exists before renewing).
import prisma from "../../../infra/prisma/prisma.js";

class RentRepository {
  model = prisma.rent;

  findRentState({ rentId }) {
    return prisma.rent.findUnique({
      where: { id: Number(rentId) },
      select: { id: true, name: true },
    });
  }
}

export const rentRepository = new RentRepository();
export { RentRepository };
