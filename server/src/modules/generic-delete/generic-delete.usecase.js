// Allow-listed model deletion. Prisma I/O is delegated to genericDeleteRepository;
// scope, time windows, and MeetingReminder cleanup remain in this usecase.
import dayjs from "dayjs";
import { AppError } from "../../shared/errors/AppError.js";
import {
  authMessagesCodes,
  hasPermission,
  PERMISSIONS,
  projectsMessagesCodes,
} from "@dms/shared";
import { deleteCalendarEvent } from "../../infra/google/google-calendar.client.js";
import { genericDeleteRepository } from "./generic-delete.repo.js";
import { leadRepository } from "../leads/lead/lead.repo.js";
import { projectRepository } from "../projects/project/project.repo.js";
import { checkNoteDeletionAccess } from "../notes/note.usecase.js";

export async function deleteAllowedModel({ id, isAdmin, data, hasSuperSalesScope }) {
  const model = data.model;
  const item = await genericDeleteRepository.findModelCreatedAt({ model, id });
  if (!item) {
    throw new AppError({ code: projectsMessagesCodes.NOTE_TARGET_NOT_FOUND, statusCode: 404 });
  }

  if (!isAdmin) {
    const now = dayjs();
    const createdAt = dayjs(item.createdAt);
    const diffInMinutes = now.diff(createdAt, "minute");
    if (hasSuperSalesScope) {
      const timeNotExceedTwoDays =
        dayjs().diff(dayjs(item.createdAt), "day") < 2;
      if (!timeNotExceedTwoDays) {
        throw new AppError({ code: projectsMessagesCodes.DELETE_NOT_ALLOWED, statusCode: 409 });
      }
    } else if (diffInMinutes > 5) {
      throw new AppError({ code: projectsMessagesCodes.DELETE_NOT_ALLOWED, statusCode: 409 });
    }
  }
  if (model === "MeetingReminder") {
    const meeting = await genericDeleteRepository.findMeetingReminder({ id });
    if (meeting && meeting.googleEventId) {
      await deleteCalendarEvent(meeting);
    }
    if (meeting && meeting.availableSlotId) {
      await genericDeleteRepository.freeAvailableSlot({
        availableSlotId: meeting.availableSlotId,
      });
    }
  }

  // Contract has RESTRICT foreign keys (projects, notes, delivery-schedule stage links)
  // that make a plain delete fail (P2003). Tear it down in FK-safe order, keeping projects
  // (contractId nulled) and delivery schedules (stage link nulled). See the repo method.
  if (model === "contract" || model === "Contract") {
    await genericDeleteRepository.deleteContractWithDependents({ id });
    return { data: item };
  }

  // ClientLeadUpdate has RESTRICT foreign keys (its SharedUpdates + Notes) that make a plain
  // delete fail (P2003). Tear down the update's own scoped children first, server-side, so we
  // never rely on a client-supplied cascade. See the repo method.
  if (model === "ClientLeadUpdate") {
    await genericDeleteRepository.deleteClientLeadUpdateWithDependents({ id });
    return { data: item };
  }

  await genericDeleteRepository.deleteModel({ model, id });
  return { data: item };
}

class GenericDeleteUsecase {
  isAdminUser(authUser) {
    return Boolean(authUser?.isAdminTier);
  }

  async checkIfUserCanDeleteModel({ id, body, authUser }) {
    if (body.model === "Note") {
      return checkNoteDeletionAccess({ id, authUser });
    }
    const target = await genericDeleteRepository.resolveTarget({
      model: body.model,
      id,
    });
    if (!target) throw new AppError({ code: projectsMessagesCodes.NOTE_TARGET_NOT_FOUND, statusCode: 404 });

    if (target.kind === "site-utility") {
      if (
        !hasPermission(
          authUser?.permissions,
          PERMISSIONS.SITE_UTILITY.PAYMENT_CONDITION_DELETE,
        )
      ) {
        throw new AppError({ code: authMessagesCodes.PERMISSION_DENIED, statusCode: 403 });
      }
      return target;
    }
    if (target.kind === "project") {
      const where = projectRepository.buildAuthUserProjectWhere({
        authUser,
        where: { id: Number(target.projectId) },
        mode: "mutate",
      });
      const project = await projectRepository.findScopedProject({ where });
      if (!project) throw new AppError({ code: authMessagesCodes.ACCESS_DENIED, statusCode: 403 });
      return target;
    }
    const where = leadRepository.buildAuthUserLeadWhere({
      authUser,
      where: { id: Number(target.clientLeadId) },
      mode: "mutate",
    });
    const lead = await leadRepository.findScopedLead({ where });
    if (!lead) throw new AppError({ code: authMessagesCodes.ACCESS_DENIED, statusCode: 403 });
    return target;
  }

  async deleteModel({ id, body, authUser }) {
    if (!body?.model) {
      throw new AppError({
        code: projectsMessagesCodes.DELETE_MODEL_REQUIRED,
        statusCode: 400,
      });
    }
    return deleteAllowedModel({
      id: Number(id),
      isAdmin: this.isAdminUser(authUser),
      hasSuperSalesScope: authUser?.currentProfileKey === "SUPER_SALES",
      data: { model: body.model },
    });
  }
}

export const genericDeleteUsecase = new GenericDeleteUsecase();
export { GenericDeleteUsecase };
