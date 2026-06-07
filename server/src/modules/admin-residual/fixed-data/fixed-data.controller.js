// admin-residual/fixed-data controller — thin. Language-neutral codes REPLACE the legacy
// prose ("Created/Updated/Deleted successfully").
import { ok, created } from "../../../shared/http/response.js";
import { adminResidualMessagesCodes, messagesNames } from "@dms/shared";
import { fixedDataUsecase } from "./fixed-data.usecase.js";

const M = adminResidualMessagesCodes;
const TK = messagesNames.adminResidualMessages;

export class FixedDataController {
  constructor(usecase) {
    this.usecase = usecase;
  }

  create = async (req, res) => {
    const data = await this.usecase.create({ data: req.body });
    return created(res, data, M.FIXED_DATA_CREATED, TK);
  };

  update = async (req, res) => {
    const data = await this.usecase.update({ id: req.params.id, data: req.body });
    return ok(res, data, M.FIXED_DATA_UPDATED, TK);
  };

  remove = async (req, res) => {
    const data = await this.usecase.remove({ id: req.params.id });
    return ok(res, data, M.FIXED_DATA_DELETED, TK);
  };
}

export const fixedDataController = new FixedDataController(fixedDataUsecase);
