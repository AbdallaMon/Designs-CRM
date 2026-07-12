// accounting/rent usecase — orchestration only (no Prisma). The list read + the create/renew
// multi-writes (Rent / RentPeriod / linked Outcome) are delegated to rent.repo.js; the
// required-fields / "Rent not found" guards (byte-identical to legacy) and the row-shaping
// (via rent.dto.js) are orchestrated here. The renew guard 404s a forged/missing rent id
// before the writes run (additive hardening, unchanged from before this reorg).
//
// The `legacy` constructor param remains a dependency-injection seam; its defaults now point
// at the relocated repo/usecase code instead of the deleted accountant service.
import { AppError } from "../../../shared/errors/AppError.js";
import { accountingMessagesCodes as C } from "@dms/shared";
import { rentRepository } from "./rent.repo.js";
import { shapeRentRow, shapeRentList } from "./rent.dto.js";
import { translateLegacyAccountingError } from "../accounting.errors.js";

export class RentUsecase {
  /**
   * @param {import("./rent.repo.js").RentRepository} repository
   * @param {object} [legacy] dependency-injection seam (defaults to the relocated code)
   */
  constructor(repository, legacy = {}) {
    this.repo = repository;
    const defaults = {
      getRents: (a) => this._getRents(a),
      createARent: (a) => this._createARent(a),
      renewRentAndMakeOutCome: (a) => this._renewRentAndMakeOutCome(a),
    };
    this.legacy = { ...defaults, ...legacy };
  }

  async checkRentExists({ rentId }) {
    const rent = await this.repo.findRentState({ rentId });
    if (!rent) throw new AppError(C.RENT_NOT_FOUND, 404);
    return rent;
  }

  // ── relocated list read + shaping (formerly legacy getRents) ─────────────────────
  async _getRents({ limit = 1, skip = 10 }) {
    let rents = await this.repo.findManyRents({ limit, skip });

    rents = shapeRentList(rents);
    const total = await this.repo.countRents();
    const totalPages = Math.ceil(total / limit);

    return {
      data: rents,
      total,
      totalPages,
    };
  }

  // ── relocated create orchestration (formerly legacy createARent) ─────────────────
  async _createARent(data) {
    let { name, amount, description, startDate, endDate, paymentDate } = data;
    if (!name || !amount || !startDate || !endDate || !paymentDate) {
      throw new Error("Fill all the fields please");
    }

    amount = Number(amount);

    const newRent = await this.repo.createRent({
      name,
      description,
    });

    const newRentPeriod = await this._renewRentAndMakeOutCome({
      rentId: newRent.id,
      name,
      amount,
      description,
      startDate,
      endDate,
      paymentDate,
    });
    let createdRent = await this.repo.findRentRow({ id: newRent.id });
    createdRent = shapeRentRow(createdRent);

    return {
      data: createdRent,
      message: "Rent created successfully",
    };
  }

  // ── relocated renew orchestration (formerly legacy renewRentAndMakeOutCome) ───────
  async _renewRentAndMakeOutCome({ rentId, amount, startDate, endDate, paymentDate, name }) {
    if (!rentId || !amount || !startDate || !endDate) {
      throw new Error("Fill all the fields please");
    }

    amount = Number(amount);
    const rent = await this.repo.findRentForRenew({ id: rentId });

    if (!rent) {
      throw new Error("Rent not found");
    }

    const newRentPeriod = await this.repo.createRentPeriod({
      amount,
      rentId: rent.id,
      startDate,
      endDate,
    });

    const outcome = await this.repo.createRentOutcome({
      amount,
      name,
      paymentDate,
      rentPeriodId: newRentPeriod.id,
    });

    return {
      data: newRentPeriod,
      message: "Rent renewed successfully",
    };
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
