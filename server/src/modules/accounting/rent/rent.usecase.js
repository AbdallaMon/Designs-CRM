// accounting/rent usecase — orchestration only (no Prisma). Behavior ported 1:1 from the
// legacy handlers + accountant service. createARent and renewRentAndMakeOutCome each
// write multiple rows (Rent / RentPeriod / Outcome); we invoke the existing service so
// that interleaved multi-write behavior is preserved exactly. The renew guard 404s a
// forged/missing rent id before the service runs (additive hardening).
import { AppError } from "../../../shared/errors/AppError.js";
import { accountingMessagesCodes as C } from "@dms/shared";
import { rentRepository } from "./rent.repository.js";

const legacyDefaults = {
  getRents: (a) =>
    import("../../../../services/main/accountant/accountantServices.js").then((m) => m.getRents(a)),
  createARent: (a) =>
    import("../../../../services/main/accountant/accountantServices.js").then((m) => m.createARent(a)),
  renewRentAndMakeOutCome: (a) =>
    import("../../../../services/main/accountant/accountantServices.js").then((m) =>
      m.renewRentAndMakeOutCome(a),
    ),
};

export class RentUsecase {
  /**
   * @param {import("./rent.repository.js").RentRepository} repository
   * @param {Partial<typeof legacyDefaults>} [legacy]
   */
  constructor(repository, legacy = {}) {
    this.repo = repository;
    this.legacy = { ...legacyDefaults, ...legacy };
  }

  async checkRentExists({ rentId }) {
    const rent = await this.repo.findRentState({ rentId });
    if (!rent) throw new AppError(C.RENT_NOT_FOUND, 404);
    return rent;
  }

  list({ skip, limit }) {
    return this.legacy.getRents({ limit: Number(limit), skip: Number(skip) });
  }

  create({ body }) {
    return this.legacy.createARent(body);
  }

  renew({ rentId, body }) {
    const { amount, startDate, endDate, paymentDate, name } = body;
    return this.legacy.renewRentAndMakeOutCome({
      rentId: Number(rentId),
      amount,
      startDate,
      endDate,
      paymentDate,
      name,
    });
  }
}

export const rentUsecase = new RentUsecase(rentRepository);
