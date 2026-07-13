// accounting/rent controller — thin. Reads validated input, delegates, responds. The
// `checkRentExists` method is the existence guard wired with requireSpecialChecker.
import { ok, created } from "../../../shared/http/response.js";
import { accountingMessagesCodes, messagesNames } from "@dms/shared";
import { rentUsecase } from "./rent.usecase.js";
import { withRentListCapabilities } from "./rent.dto.js";

const TK = messagesNames.accountingMessages;

import { paginate } from "../../../shared/utility/pagination.js";

class RentController {
  checkRentExists(req) {
    return rentUsecase.checkRentExists({ rentId: req.params.rentId });
  }

  async getRents(req, res) {
    const { page, limit, skip } = paginate(req.query);
    const result = await rentUsecase.listRents({ skip, limit, page });
    const items = withRentListCapabilities(result.data ?? [], req.auth);
    return ok(res, { items, total: result.total ?? 0, page, pageSize: limit }, accountingMessagesCodes.RENTS_FETCHED, TK);
  }

  async createRent(req, res) {
    const result = await rentUsecase.createRent({ body: req.body });
    return created(res, result.data ?? result, accountingMessagesCodes.RENT_CREATED, TK);
  }

  async renew(req, res) {
    const result = await rentUsecase.renew({ rentId: req.params.rentId, body: req.body });
    return ok(res, result.data ?? result, accountingMessagesCodes.RENT_RENEWED, TK);
  }
}

export const rentController = new RentController();
export { RentController };
