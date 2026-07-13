// admin-residual/model-archive controller — thin. Language-neutral code REPLACES the
// legacy prose ("Updated succssfully").
import { ok } from "../../../shared/http/response.js";
import { adminResidualMessagesCodes, messagesNames } from "@dms/shared";
import { modelArchiveUsecase } from "./model-archive.usecase.js";

const TK = messagesNames.adminResidualMessages;

class ModelArchiveController {
  async archiveModel(req, res) {
    const data = await modelArchiveUsecase.archiveModel({
      model: req.query.model,
      id: req.params.id,
      isArchived: req.body.isArchived,
    });
    return ok(res, data, adminResidualMessagesCodes.MODEL_ARCHIVE_UPDATED, TK);
  }
}

export const modelArchiveController = new ModelArchiveController();
export { ModelArchiveController };
