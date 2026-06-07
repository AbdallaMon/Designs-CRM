// admin-residual/model-archive controller — thin. Language-neutral code REPLACES the
// legacy prose ("Updated succssfully").
import { ok } from "../../../shared/http/response.js";
import { adminResidualMessagesCodes, messagesNames } from "@dms/shared";
import { modelArchiveUsecase } from "./model-archive.usecase.js";

const M = adminResidualMessagesCodes;
const TK = messagesNames.adminResidualMessages;

export class ModelArchiveController {
  constructor(usecase) {
    this.usecase = usecase;
  }

  archive = async (req, res) => {
    const data = await this.usecase.archive({
      model: req.query.model,
      id: req.params.id,
      isArchived: req.body.isArchived,
    });
    return ok(res, data, M.MODEL_ARCHIVE_UPDATED, TK);
  };
}

export const modelArchiveController = new ModelArchiveController(modelArchiveUsecase);
