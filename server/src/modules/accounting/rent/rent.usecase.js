// accounting/rent usecase — orchestration only (no Prisma). The list read + the create/renew
// multi-writes (Rent / RentPeriod / linked Outcome) are delegated to rent.repo.js; the
// required-fields / "Rent not found" guards (byte-identical to legacy) and the row-shaping
// (via rent.dto.js) are orchestrated here. The renew guard 404s a forged/missing rent id
// before the writes run (additive hardening, unchanged from before this reorg).
import { AppError } from "../../../shared/errors/AppError.js";
import { accountingMessagesCodes } from "@dms/shared";
import { rentRepository } from "./rent.repo.js";
import { shapeRentRow, shapeRentList } from "./rent.dto.js";
import { translateLegacyAccountingError } from "../accounting.errors.js";

class RentUsecase {
  async checkRentExists({ rentId }) {
    const rent = await rentRepository.findRentState({ rentId });
    if (!rent) throw new AppError(accountingMessagesCodes.RENT_NOT_FOUND, 404);
    return rent;
  }

  // ── relocated list read + shaping (formerly legacy getRents) ─────────────────────
  async _getRents({ limit = 1, skip = 10 }) {
    let rents = await rentRepository.findManyRents({ limit, skip });

    rents = shapeRentList(rents);
    const total = await rentRepository.countRents();
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

    const newRent = await rentRepository.createRent({
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
    let createdRent = await rentRepository.findRentRow({ id: newRent.id });
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
    const rent = await rentRepository.findRentForRenew({ id: rentId });

    if (!rent) {
      throw new Error("Rent not found");
    }

    const newRentPeriod = await rentRepository.createRentPeriod({
      amount,
      rentId: rent.id,
      startDate,
      endDate,
    });

    const outcome = await rentRepository.createRentOutcome({
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

  listRents({ skip, limit }) {
    return this._getRents({ limit: Number(limit), skip: Number(skip) });
  }

  // Known legacy throw: "Fill all the fields please" (createARent also delegates to
  // renewRentAndMakeOutCome, whose required-fields/"Rent not found" throws are covered too).
  createRent({ body }) {
    return translateLegacyAccountingError(() => this._createARent(body));
  }

  // Known legacy throws: "Fill all the fields please" / "Rent not found".
  renew({ rentId, body }) {
    const { amount, startDate, endDate, paymentDate, name } = body;
    return translateLegacyAccountingError(() =>
      this._renewRentAndMakeOutCome({
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

export const rentUsecase = new RentUsecase();
export { RentUsecase };
