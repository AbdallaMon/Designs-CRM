import dayjs from "dayjs";
import {
  authMessagesCodes,
  clientPortalMessagesCodes,
  hasPermission,
  PERMISSIONS,
  PROFILES,
  projectsMessagesCodes,
} from "@dms/shared";
import { AppError } from "../../shared/errors/AppError.js";
import {
  getChannelEntitiyByTeleRecordAndLeadId,
  uploadANote,
} from "../../infra/telegram/telegram-functions.js";
import { noteRepository } from "./note.repo.js";
import { leadRepository } from "../leads/lead/lead.repo.js";
import { projectRepository } from "../projects/project/project.repo.js";
import { updateRepository } from "../projects/update/update.repo.js";
import { updateTask } from "../projects/task/task.usecase.js";

const P = PERMISSIONS;
const OWNER_KEYS = [
  "clientLeadId",
  "baseEmployeeSalaryId",
  "rentId",
  "rentPeriodId",
  "operationalExpensesId",
  "paymentId",
  "invoiceId",
  "taskId",
  "commissionId",
  "updateId",
  "sharedUpdateId",
  "imageSessionId",
  "selectedImageId",
  "contractId",
  "salesStageId",
  "deliveryScheduleId",
  "notedUserId",
];

function assertPermission(authUser, code) {
  if (!hasPermission(authUser?.permissions, code)) {
    throw new AppError({ code: authMessagesCodes.PERMISSION_DENIED, statusCode: 403 });
  }
}

async function assertLeadScope({ clientLeadId, authUser, mode }) {
  if (!clientLeadId) throw new AppError({ code: projectsMessagesCodes.CLIENT_LEAD_NOT_FOUND, statusCode: 404 });
  const where = leadRepository.buildAuthUserLeadWhere({
    authUser,
    where: { id: Number(clientLeadId) },
    mode,
    includeContactInitiator: true,
  });
  const lead = await leadRepository.findScopedLead({ where });
  if (!lead) {
    // Work-stage parity: an assigned 2D/3D designer may read/write lead notes for the
    // project they are working on, without gaining ordinary lead mutation scope.
    const isDesigner = [PROFILES.DESIGNER_3D, PROFILES.DESIGNER_2D].includes(
      authUser?.currentProfileKey,
    );
    const assigned =
      isDesigner &&
      (await projectRepository.clientLeadHasAssignedProject({
        clientLeadId: Number(clientLeadId),
        userId: Number(authUser.id),
      }));
    if (!assigned) throw new AppError({ code: authMessagesCodes.ACCESS_DENIED, statusCode: 403 });
    return { clientLeadId: Number(clientLeadId), assignedProject: true };
  }
  return lead;
}

async function assertProjectScope({ projectId, authUser, mode }) {
  if (!projectId) throw new AppError({ code: projectsMessagesCodes.PROJECT_NOT_FOUND, statusCode: 404 });
  const where = projectRepository.buildAuthUserProjectWhere({
    authUser,
    where: { id: Number(projectId) },
    mode,
  });
  const project = await projectRepository.findScopedProject({ where });
  if (!project) throw new AppError({ code: authMessagesCodes.ACCESS_DENIED, statusCode: 403 });
  return project;
}

export async function checkNoteTargetAccess({ idKey, id, authUser, mode = "view" }) {
  const target = await noteRepository.resolveTarget({ idKey, id });
  if (!target) throw new AppError({ code: projectsMessagesCodes.NOTE_TARGET_NOT_FOUND, statusCode: 404 });

  if (target.kind === "accounting") {
    assertPermission(
      authUser,
      mode === "view" ? P.ACCOUNTING.NOTE_LIST : P.ACCOUNTING.NOTE_CREATE,
    );
    return target;
  }
  if (target.kind === "user") {
    if (!authUser?.isAdminTier && Number(authUser?.id) !== Number(target.userId)) {
      throw new AppError({ code: authMessagesCodes.ACCESS_DENIED, statusCode: 403 });
    }
    return target;
  }
  if (target.kind === "project") {
    assertPermission(authUser, mode === "view" ? P.TASK.LIST : P.TASK.NOTE_MANAGE);
    return assertProjectScope({ projectId: target.projectId, authUser, mode });
  }

  assertPermission(authUser, mode === "view" ? P.LEAD.VIEW : P.LEAD.NOTE_MANAGE);
  return assertLeadScope({
    clientLeadId: target.clientLeadId,
    authUser,
    mode,
  });
}

export async function checkNoteDeletionAccess({ id, authUser }) {
  const note = await noteRepository.findNoteCreatedAt({ id });
  if (!note) throw new AppError({ code: projectsMessagesCodes.NOTE_NOT_FOUND, statusCode: 404 });
  if (!authUser?.isAdminTier && Number(note.userId) !== Number(authUser?.id)) {
    throw new AppError({ code: authMessagesCodes.ACCESS_DENIED, statusCode: 403 });
  }
  const idKey = OWNER_KEYS.find((key) => note[key] != null);
  if (!idKey) throw new AppError({ code: projectsMessagesCodes.NOTE_TARGET_NOT_FOUND, statusCode: 404 });
  await checkNoteTargetAccess({
    idKey,
    id: note[idKey],
    authUser,
    mode: "mutate",
  });
  return note;
}

export async function getNotes({ idKey, id }) {
  return noteRepository.findNotesByOwner({ idKey, id });
}

export async function addNote({
  attachment,
  userId,
  content,
  idKey,
  id,
  isAdmin,
  client,
}) {
  const data = { content, attachment };
  const MAX_LENGTH = 360;

  if (client && content && content.length > MAX_LENGTH) {
    throw new AppError({ code: clientPortalMessagesCodes.NOTE_CONTENT_TOO_LONG, statusCode: 422 });
  }
  if (userId) data.userId = Number(userId);
  if (client) {
    const admin = await noteRepository.findAdminUser();
    if (!admin) throw new AppError({ code: projectsMessagesCodes.NOTE_AUTHOR_NOT_FOUND, statusCode: 500 });
    data.userId = admin.id;
  }
  if (idKey && id) data[idKey] = Number(id);

  const note = await noteRepository.createNote({ data });
  const actualNote = await noteRepository.findNoteWithUser({ id: note.id });
  if (actualNote.clientLeadId) {
    await leadRepository.touchLead({ id: actualNote.clientLeadId });
    const teleChannel = await getChannelEntitiyByTeleRecordAndLeadId({
      clientLeadId: Number(actualNote.clientLeadId),
    });
    if (teleChannel) await uploadANote(note, teleChannel);
  }
  if (actualNote.updateId) {
    await updateRepository.touchClientLeadUpdate({ id: actualNote.updateId });
    const update = await noteRepository.findUpdateLeadId({
      updateId: actualNote.updateId,
    });
    await leadRepository.touchLead({ id: update.clientLeadId });
  }
  if (actualNote.taskId) {
    await updateTask({ data: {}, taskId: actualNote.taskId, isAdmin, userId });
  }
  return note;
}

export async function deleteNote({ id, isAdmin, scopedNote }) {
  const note = scopedNote ?? (await noteRepository.findNoteCreatedAt({ id }));
  if (!note) throw new AppError({ code: projectsMessagesCodes.NOTE_NOT_FOUND, statusCode: 404 });
  if (!isAdmin) {
    const diffInMinutes = dayjs().diff(dayjs(note.createdAt), "minute");
    if (diffInMinutes > 5) {
      throw new AppError({ code: projectsMessagesCodes.NOTE_DELETE_WINDOW_EXPIRED, statusCode: 409 });
    }
  }
  await noteRepository.deleteNote({ id });
  return note;
}
