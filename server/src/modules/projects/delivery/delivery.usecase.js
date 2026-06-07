// projects/delivery usecase — business logic / orchestration. Prisma NEVER appears here
// (only repo + the shared project-scope usecase). Behavior ported 1:1 from legacy
// (routes/shared/delivery.js, services/main/shared/deliveryServices.js), invoking the
// side-effecting create/link via lazy imports.
//
// Object scope: a DeliverySchedule belongs to a Project; access requires the caller to
// be able to access THAT project (the shared project scope checker). Sub-resources
// resolve their parent project first — the IDOR fix the legacy `/:deliveryId/*` routes
// lacked.
//
// BUGFIX (preserved-as-fixed): legacy `deleteDeliverySchedule` reads `{ id }` but the
// route passed `{ deliveryId }` → `id` was undefined and the delete threw. We call it
// with the correct `id` so DELETE actually works (observable improvement, noted).
import { deliveryRepository } from "./delivery.repository.js";
import { projectUsecase } from "../shared/project-scope.js";

const legacyDefaults = {
  createNewDeliverySchedule: (a) => import("../../../../services/main/shared/index.js").then((m) => m.createNewDeliverySchedule(a)),
  linkADeliveryToMeeting: (a) => import("../../../../services/main/shared/index.js").then((m) => m.linkADeliveryToMeeting(a)),
  deleteDeliverySchedule: (a) => import("../../../../services/main/shared/index.js").then((m) => m.deleteDeliverySchedule(a)),
};

export class DeliveryUsecase {
  constructor(repository, projects = projectUsecase, legacy = {}) {
    this.repo = repository;
    this.projects = projects;
    this.legacy = { ...legacyDefaults, ...legacy };
  }

  // ── object-scope checkers (parent-project scope) ─────────────────────────────────
  // GET /:projectId/schedules → scope on the project directly.
  checkIfUserCanAccessProject = ({ projectId, authUser }) =>
    this.projects.checkIfUserCanAccessProject({ id: projectId, authUser });

  // POST / (create) → the project id is in the BODY; scope on it.
  checkIfUserCanMutateProjectFromBody = ({ projectId, authUser }) =>
    this.projects.checkIfUserCanMutateProject({ id: projectId, authUser });

  // /:deliveryId/* → resolve the delivery's parent project, then scope.
  async checkIfUserCanMutateDelivery({ deliveryId, authUser }) {
    const { projectId } = await this.projects.resolveDeliveryProject({ deliveryId });
    await this.projects.checkIfUserCanMutateProject({ id: projectId, authUser });
    return { deliveryId: Number(deliveryId), projectId };
  }

  // ════════════════════════════════════════════════════════════════════════════
  //  DELIVERY
  // ════════════════════════════════════════════════════════════════════════════
  schedules({ projectId }) {
    return this.repo.findByProject({ projectId });
  }

  create({ body, authUser }) {
    return this.legacy.createNewDeliverySchedule({ userId: authUser.id, ...body });
  }

  linkMeeting({ deliveryId, body }) {
    return this.legacy.linkADeliveryToMeeting({
      deliveryId: Number(deliveryId),
      meetingReminderId: body.meetingReminderId,
    });
  }

  // legacy bug: service signature is `{ id }`, route passed `{ deliveryId }` → pass id.
  remove({ deliveryId }) {
    return this.legacy.deleteDeliverySchedule({ id: Number(deliveryId) });
  }
}

export const deliveryUsecase = new DeliveryUsecase(deliveryRepository);
