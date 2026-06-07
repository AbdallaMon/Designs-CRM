// Thin controller for the delivery surface. The checkIfUserCan* methods resolve the
// parent project (in the usecase) and run the SHARED project scope checker.
import { ok, created } from "../../../shared/http/response.js";
import { projectsMessagesCodes, messagesNames } from "@dms/shared";
import { deliveryUsecase } from "./delivery.usecase.js";
import { withDeliveryListCapabilities } from "./delivery.dto.js";

const C = projectsMessagesCodes;
const TK = messagesNames.projectsMessages;

export class DeliveryController {
  /** @param {import("./delivery.usecase.js").DeliveryUsecase} usecase */
  constructor(usecase) {
    this.usecase = usecase;
  }

  // ── object-scope checkers ──────────────────────────────────────────────────────
  // GET /:projectId/schedules → scope on the project path param.
  checkIfUserCanAccessProject = (req) =>
    this.usecase.checkIfUserCanAccessProject({ projectId: req.params.projectId, authUser: req.auth });

  // POST / (create) → project id in the BODY.
  checkIfUserCanMutateProjectFromBody = (req) =>
    this.usecase.checkIfUserCanMutateProjectFromBody({ projectId: req.body.projectId, authUser: req.auth });

  // /:deliveryId/* → resolve the delivery's parent project.
  checkIfUserCanMutateDelivery = (req) =>
    this.usecase.checkIfUserCanMutateDelivery({ deliveryId: req.params.deliveryId, authUser: req.auth });

  // ── handlers ─────────────────────────────────────────────────────────────────
  schedules = async (req, res) => {
    const data = await this.usecase.schedules({ projectId: req.params.projectId });
    return ok(res, withDeliveryListCapabilities(data, req.auth), C.DELIVERY_SCHEDULES_FETCHED, TK);
  };

  create = async (req, res) => {
    const data = await this.usecase.create({ body: req.body, authUser: req.auth });
    return created(res, data, C.DELIVERY_SCHEDULE_CREATED, TK);
  };

  linkMeeting = async (req, res) => {
    const data = await this.usecase.linkMeeting({ deliveryId: req.params.deliveryId, body: req.body });
    return ok(res, data, C.DELIVERY_LINKED_TO_MEETING, TK);
  };

  remove = async (req, res) => {
    const data = await this.usecase.remove({ deliveryId: req.params.deliveryId });
    return ok(res, data, C.DELIVERY_SCHEDULE_DELETED, TK);
  };
}

export const deliveryController = new DeliveryController(deliveryUsecase);
