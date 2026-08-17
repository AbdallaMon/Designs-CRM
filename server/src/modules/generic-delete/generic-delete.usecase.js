// Allow-listed model deletion. Prisma I/O is delegated to genericDeleteRepository;
// scope, time windows, and post-commit side effects remain in this usecase.
import dayjs from "dayjs";
import { AppError } from "../../shared/errors/AppError.js";
import {
  PROFILES, authMessagesCodes,
  generalMessagesCodes,
  hasPermission,
  projectsMessagesCodes,
} from "@dms/shared";
import { deleteCalendarEvent } from "../../infra/google/google-calendar.client.js";
import { genericDeleteRepository } from "./generic-delete.repo.js";
import { leadRepository } from "../leads/lead/lead.repo.js";
import { projectRepository } from "../projects/project/project.repo.js";
import { checkNoteDeletionAccess } from "../notes/note.usecase.js";
import { getGenericDeleteDefinition } from "./generic-delete.config.js";

function notFound() {
  return new AppError({
    code: generalMessagesCodes.NOT_FOUND,
    statusCode: 404,
  });
}

function assertActionPermission({ authUser, permission }) {
  if (!hasPermission(authUser?.permissions, permission)) {
    throw new AppError({
      code: authMessagesCodes.PERMISSION_DENIED,
      statusCode: 403,
    });
  }
}

export async function deleteAllowedModel({ id, isAdmin, data, hasSuperSalesScope }) {
  const model = data.model;
  const definition = getGenericDeleteDefinition(model);
  if (!definition) {
    throw new AppError({
      code: generalMessagesCodes.VALIDATION_ERROR,
      statusCode: 422,
    });
  }
  const item = await genericDeleteRepository.findModelCreatedAt({ model, id });
  if (!item) {
    throw notFound();
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
  if (definition.action === "delete-meeting") {
    const meeting = await genericDeleteRepository.deleteMeetingReminderWithCleanup({ id });
    if (!meeting) throw notFound();
    if (meeting.googleEventId) await deleteCalendarEvent(meeting);
    return { data: item };
  }

  // Contract has RESTRICT foreign keys (projects, notes, delivery-schedule stage links)
  // that make a plain delete fail (P2003). Tear it down in FK-safe order, keeping projects
  // (contractId nulled) and delivery schedules (stage link nulled). See the repo method.
  if (definition.action === "delete-contract") {
    await genericDeleteRepository.deleteContractWithDependents({ id });
    return { data: item };
  }

  // ClientLeadUpdate has RESTRICT foreign keys (its SharedUpdates + Notes) that make a plain
  // delete fail (P2003). Tear down the update's own scoped children first, server-side, so we
  // never rely on a client-supplied cascade. See the repo method.
  if (definition.action === "delete-client-lead-update") {
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
    const definition = getGenericDeleteDefinition(body.model);
    if (!definition) {
      throw new AppError({
        code: generalMessagesCodes.VALIDATION_ERROR,
        statusCode: 422,
      });
    }
    assertActionPermission({
      authUser,
      permission: definition.permission,
    });

    if (definition.scope === "note") {
      return checkNoteDeletionAccess({ id, authUser });
    }
    const target = await genericDeleteRepository.resolveTarget({
      model: body.model,
      id,
    });
    if (!target) throw notFound();

    if (target.kind === "site-utility") return target;
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
    if (!getGenericDeleteDefinition(body.model)) {
      throw new AppError({
        code: generalMessagesCodes.VALIDATION_ERROR,
        statusCode: 422,
      });
    }
    return deleteAllowedModel({
      id: Number(id),
      isAdmin: this.isAdminUser(authUser),
      hasSuperSalesScope: authUser?.currentProfileKey === PROFILES.SUPER_SALES,
      data: { model: body.model },
    });
  }
}

export const genericDeleteUsecase = new GenericDeleteUsecase();
export { GenericDeleteUsecase };
