// Generic model delete — the delete flow relocated 1:1 from the legacy
// `shared/legacy/note-services.js` `deleteAModel`. Prisma I/O is delegated to
// `genericDeleteRepository`; the non-admin 5-minute window, the super-sales 2-day window, and
// the MeetingReminder calendar cleanup stay here (business logic / infra orchestration). The
// module-level `deleteAModel` is the shared entry consumed BOTH by this module's usecase and
// by projects/task (wired into their DI seams) — replacing the removed shared/legacy barrel.
// Authentication + the model allow-list are enforced at the route/validation layer.
import dayjs from "dayjs";
import { AppError } from "../../shared/errors/AppError.js";
import { deleteCalendarEvent } from "../../infra/google/google-calendar.client.js";
import { genericDeleteRepository } from "./generic-delete.repo.js";

export async function deleteAModel({ id, isAdmin, data, isSuperSales }) {
  const model = data.model;
  const item = await genericDeleteRepository.findModelCreatedAt({ model, id });
  if (!item) {
    throw new Error(`${data.model} not found`);
  }

  if (!isAdmin) {
    const now = dayjs();
    const createdAt = dayjs(item.createdAt);
    const diffInMinutes = now.diff(createdAt, "minute");
    if (isSuperSales) {
      const timeNotExceedTwoDays =
        dayjs().diff(dayjs(item.createdAt), "day") < 2;
      if (!timeNotExceedTwoDays) {
        throw new Error(
          `Super Sales can only delete ${data.model} within 2 days of creation`
        );
      }
    } else if (diffInMinutes > 5) {
      throw new Error(`Cannot delete ${data.model} older than 5 minutes`);
    }
  }
  if (data.deleteModelesBeforeMain) {
    for (const mod of data.deleteModelesBeforeMain) {
      let where = {};
      if (mod.key) {
        where[mod.key] = Number(id);
      } else if (mod.keyIn) {
        where = {
          ...mod.keyIn,
        };
      }
      await genericDeleteRepository.deleteManyBySpec({ name: mod.name, where });
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
    return { data: item, message: `${data.model} deleted successfully` };
  }

  // ClientLeadUpdate has RESTRICT foreign keys (its SharedUpdates + Notes) that make a plain
  // delete fail (P2003). Tear down the update's own scoped children first, server-side, so we
  // never rely on a client-supplied cascade. See the repo method.
  if (model === "ClientLeadUpdate") {
    await genericDeleteRepository.deleteClientLeadUpdateWithDependents({ id });
    return { data: item, message: `${data.model} deleted successfully` };
  }

  await genericDeleteRepository.deleteModel({ model, id });
  return { data: item, message: `${data.model} deleted successfully` };
}

class GenericDeleteUsecase {
  isAdminUser(authUser) {
    return authUser?.role === "ADMIN" || authUser?.role === "SUPER_ADMIN";
  }

  async deleteModel({ id, body, authUser }) {
    if (!body?.model) throw new AppError("DELETE_MODEL_REQUIRED", 400);
    // NOTE: `deleteModelesBeforeMain` is intentionally NOT forwarded (the schema strips it),
    // so this endpoint can never cascade-delete arbitrary models.
    return deleteAModel({
      id: Number(id),
      isAdmin: this.isAdminUser(authUser),
      isSuperSales: authUser?.currentProfileKey === "SUPER_SALES",
      data: { model: body.model },
    });
  }
}

export const genericDeleteUsecase = new GenericDeleteUsecase();
export { GenericDeleteUsecase };
