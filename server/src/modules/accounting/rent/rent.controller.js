// accounting/rent controller — thin. Reads validated input, delegates, responds. The
// `checkRentExists` method is the existence guard wired with requireSpecialChecker.
import { ok, created } from "../../../shared/http/response.js";
import { accountingMessagesCodes, messagesNames } from "@dms/shared";
import { rentUsecase } from "./rent.usecase.js";
import { withRentListCapabilities } from "./rent.dto.js";

const C = accountingMessagesCodes;
const TK = messagesNames.accountingMessages;

function paginate(query) {
  const page = parseInt(query.page, 10) || 1;
  const limit = parseInt(query.limit, 10) || 10;
  return { page, limit, skip: (page - 1) * limit };
}

export class RentController {
  constructor(usecase) {
    this.usecase = usecase;
  }

  checkRentExists = (req) => this.usecase.checkRentExists({ rentId: req.params.rentId });

  list = async (req, res) => {
    const { page, limit, skip } = paginate(req.query);
    const result = await this.usecase.list({ skip, limit, page });
    const items = withRentListCapabilities(result.data ?? [], req.auth);
    return ok(res, { items, total: result.total ?? 0, page, pageSize: limit }, C.RENTS_FETCHED, TK);
  };

  create = async (req, res) => {
    const result = await this.usecase.create({ body: req.body });
    return created(res, result.data ?? result, C.RENT_CREATED, TK);
  };

  renew = async (req, res) => {
    const result = await this.usecase.renew({ rentId: req.params.rentId, body: req.body });
    return ok(res, result.data ?? result, C.RENT_RENEWED, TK);
  };
}

export const rentController = new RentController(rentUsecase);
