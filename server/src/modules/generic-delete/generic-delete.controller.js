import { deleted } from "../../shared/http/response.js";
import { genericDeleteUsecase } from "./generic-delete.usecase.js";

class GenericDeleteController {
  async deleteModel(req, res) {
    await genericDeleteUsecase.deleteModel({
      id: req.params.id,
      body: req.body,
      authUser: req.auth,
    });
    return deleted(res);
  }
}

export const genericDeleteController = new GenericDeleteController();
export { GenericDeleteController };
