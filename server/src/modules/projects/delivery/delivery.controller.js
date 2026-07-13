// Thin controller for the delivery surface. The checkIfUserCan* methods resolve the
// parent project (in the usecase) and run the SHARED project scope checker.
import { ok, created } from "../../../shared/http/response.js";
import { projectsMessagesCodes, messagesNames } from "@dms/shared";
import { deliveryUsecase } from "./delivery.usecase.js";
import { withDeliveryListCapabilities } from "./delivery.dto.js";

const TK = messagesNames.projectsMessages;

class DeliveryController {
  // ── object-scope checkers ──────────────────────────────────────────────────────
  // GET /:projectId/schedules → scope on the project path param.
  checkIfUserCanAccessProject(req) {
    return deliveryUsecase.checkIfUserCanAccessProject({ projectId: req.params.projectId, authUser: req.auth });
  }

  // POST / (create) → project id in the BODY.
  checkIfUserCanMutateProjectFromBody(req) {
    return deliveryUsecase.checkIfUserCanMutateProjectFromBody({ projectId: req.body.projectId, authUser: req.auth });
  }

  // /:deliveryId/* → resolve the delivery's parent project.
  checkIfUserCanMutateDelivery(req) {
    return deliveryUsecase.checkIfUserCanMutateDelivery({ deliveryId: req.params.deliveryId, authUser: req.auth });
  }

  // ── handlers ─────────────────────────────────────────────────────────────────
  async getDeliverySchedules(req, res) {
    const data = await deliveryUsecase.listDeliverySchedules({ projectId: req.params.projectId });
    return ok(res, withDeliveryListCapabilities(data, req.auth), projectsMessagesCodes.DELIVERY_SCHEDULES_FETCHED, TK);
  }

  async createDeliverySchedule(req, res) {
    const data = await deliveryUsecase.createDeliverySchedule({ body: req.body, authUser: req.auth });
    return created(res, data, projectsMessagesCodes.DELIVERY_SCHEDULE_CREATED, TK);
  }

  async linkMeeting(req, res) {
    const data = await deliveryUsecase.linkMeeting({ deliveryId: req.params.deliveryId, body: req.body });
    return ok(res, data, projectsMessagesCodes.DELIVERY_LINKED_TO_MEETING, TK);
  }

  async deleteDeliverySchedule(req, res) {
    const data = await deliveryUsecase.deleteDeliverySchedule({ deliveryId: req.params.deliveryId });
    return ok(res, data, projectsMessagesCodes.DELIVERY_SCHEDULE_DELETED, TK);
  }
}

export const deliveryController = new DeliveryController();
export { DeliveryController };
