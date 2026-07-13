// admin-residual/fixed-data controller — thin. Language-neutral codes REPLACE the legacy
// prose ("Created/Updated/Deleted successfully").
import { ok, created } from "../../../shared/http/response.js";
import { adminResidualMessagesCodes, messagesNames } from "@dms/shared";
import { fixedDataUsecase } from "./fixed-data.usecase.js";

const TK = messagesNames.adminResidualMessages;

class FixedDataController {
  async createFixedData(req, res) {
    const data = await fixedDataUsecase.createFixedData({ data: req.body });
    return created(res, data, adminResidualMessagesCodes.FIXED_DATA_CREATED, TK);
  }

  async updateFixedData(req, res) {
    const data = await fixedDataUsecase.updateFixedData({ id: req.params.id, data: req.body });
    return ok(res, data, adminResidualMessagesCodes.FIXED_DATA_UPDATED, TK);
  }

  async deleteFixedData(req, res) {
    const data = await fixedDataUsecase.deleteFixedData({ id: req.params.id });
    return ok(res, data, adminResidualMessagesCodes.FIXED_DATA_DELETED, TK);
  }
}

export const fixedDataController = new FixedDataController();
export { FixedDataController };
