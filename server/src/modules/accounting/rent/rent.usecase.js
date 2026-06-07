// accounting/rent usecase — orchestration only (no Prisma). Behavior ported 1:1 from the
// legacy handlers + accountant service. createARent and renewRentAndMakeOutCome each
// write multiple rows (Rent / RentPeriod / Outcome); we invoke the existing service so
// that interleaved multi-write behavior is preserved exactly. The renew guard 404s a
// forged/missing rent id before the service runs (additive hardening).
import { AppError } from "../../../shared/errors/AppError.js";
import { accountingMessagesCodes as C } from "@dms/shared";
import { rentRepository } from "./rent.repository.js";
import { translateLegacyAccountingError } from "../accounting.legacy-errors.js";

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

  // Known legacy throw: "Fill all the fields please" (createARent also delegates to
  // renewRentAndMakeOutCome, whose required-fields/"Rent not found" throws are covered too).
  create({ body }) {
    return translateLegacyAccountingError(() => this.legacy.createARent(body));
  }

  // Known legacy throws: "Fill all the fields please" / "Rent not found".
  renew({ rentId, body }) {
    const { amount, startDate, endDate, paymentDate, name } = body;
    return translateLegacyAccountingError(() =>
      this.legacy.renewRentAndMakeOutCome({
        rentId: Number(rentId),
        amount,
        startDate,
        endDate,
        paymentDate,
        name,
      }),
    );
  }
}

export const rentUsecase = new RentUsecase(rentRepository);
