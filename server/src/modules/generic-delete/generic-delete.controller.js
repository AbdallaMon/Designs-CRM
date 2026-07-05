import { deleted } from "../../shared/http/response.js";
import { genericDeleteUsecase } from "./generic-delete.usecase.js";

class GenericDeleteController {
  remove = async (req, res) => {
    await genericDeleteUsecase.remove({
      id: req.params.id,
      body: req.body,
      authUser: req.auth,
    });
    return deleted(res);
  };
}

export const genericDeleteController = new GenericDeleteController();
