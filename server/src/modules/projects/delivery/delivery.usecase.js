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
import dayjs from "dayjs";
import { deliveryRepository } from "./delivery.repo.js";
import { projectUsecase } from "../shared/project-scope.js";
import { uploadANote } from "../../../infra/telegram/telegram-functions.js";

// Behavior ported 1:1 from legacy deliveryServices (create carries a telegram-note side
// effect; Prisma I/O delegated to the repo). Exposed through the `legacy` seam below so
// the existing DI/test seam is preserved.
async function createNewDeliverySchedule({ projectId, deliveryAt, userId, name }) {
  const schedule = await deliveryRepository.create({ projectId, deliveryAt, userId, name });
  const now = dayjs.utc().startOf("day");

  const deliveryDate = dayjs(deliveryAt);
  const daysLeft = deliveryDate.diff(now, "day");
  const project = await deliveryRepository.findProjectById({ projectId });
  let timeLeftLabel;
  if (daysLeft === 1) timeLeftLabel = "Tomorrow";
  else if (daysLeft === 0) timeLeftLabel = "Today";
  else timeLeftLabel = `${daysLeft} days left`;
  const link = `${process.env.LEGACY_DASHBOARD_ORIGIN}/dashboard/projects/${projectId}`;

  const note = {
    id: `note-${projectId}-${userId}`,
    clientLeadId: project.clientLeadId,
    content: `New delivery schedule with name :${name} created for project ${project.type} in lead #${project.clientLeadId} - ${timeLeftLabel}. View it here: ${link}`,
    binMessage: true,
  };
  await uploadANote(note);
  return schedule;
}

async function linkADeliveryToMeeting({ deliveryId, meetingReminderId }) {
  // legacy read the meeting then (deliveryAt sync commented out) updated the link.
  await deliveryRepository.findMeetingReminderById({ meetingReminderId });
  const delivery = await deliveryRepository.linkMeeting({ deliveryId, meetingReminderId });
  return delivery;
}

const deleteDeliverySchedule = ({ id }) => deliveryRepository.deleteById({ id });

const legacyDefaults = {
  createNewDeliverySchedule,
  linkADeliveryToMeeting,
  deleteDeliverySchedule,
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
