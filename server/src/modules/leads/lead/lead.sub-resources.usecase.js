// leads/lead — STAFF sub-resource orchestration (notes / call & meeting reminders /
// price offers / files). Extracted VERBATIM from lead.usecase.js (behavior-preserving;
// no logic/value change). Imported back into lead.usecase.js and wired into the
// `legacyDefaults` DI seam there; `getCallReminders` is re-exported from lead.usecase.js
// (consumed by admin-residual/staff). Prisma NEVER appears here (only repo calls); the
// interleaved notification / telegram side effects run from their infra locations.
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";
import { v4 as uuidv4 } from "uuid";
import { leadRepository } from "./lead.repo.js";
import {
  getChannelEntitiyByTeleRecordAndLeadId,
  uploadAnAttachment,
  uploadANote,
} from "../../../infra/telegram/telegram-functions.js";
import {
  newCallNotification,
  newFileUploaded,
  newNoteNotification,
  newPriceOffer,
  updateCallNotification,
  updateMettingNotification,
} from "../../../infra/notifications/index.js";
import { AppError } from "../../../shared/errors/AppError.js";
import { leadsMessagesCodes as C } from "@dms/shared";

dayjs.extend(utc);
dayjs.extend(timezone);

// ════════════════════════════════════════════════════════════════════════════════
//  STAFF sub-resource orchestration (ported 1:1 from the former legacy/staff-services.js).
//  Prisma I/O is delegated to leadRepository; the interleaved SIDE EFFECTS (notifications,
//  telegram channels, updateLead, uuid tokens, dayjs tz) run from their CURRENT infra
//  locations (imported above). Behavior, guards, error strings, and typos are verbatim.
// ════════════════════════════════════════════════════════════════════════════════
export async function createNote({ clientLeadId, userId, content }) {
  if (!content.trim()) {
    throw new AppError(C.NOTE_CONTENT_EMPTY, 400);
  }

  const newNote = await leadRepository.createNoteRecord({
    content,
    clientLeadId,
    userId,
  });
  if (clientLeadId) {
    const teleChannel = await getChannelEntitiyByTeleRecordAndLeadId({
      clientLeadId: Number(clientLeadId),
    });
    const note = await leadRepository.findNoteWithUser({ id: newNote.id });
    if (teleChannel) {
      await uploadANote(note, teleChannel);
    }
  }
  await leadRepository.touchLead({ id: clientLeadId });
  newNote.content = content;
  await newNoteNotification(clientLeadId, content, newNote.user.id);
  return newNote;
}

export async function createCallReminder({
  clientLeadId,
  userId,
  time,
  reminderReason,
}) {
  const userTimezone = dayjs.tz.guess(); // Detect user's timezone

  let formattedTime = dayjs(time).tz(userTimezone).utc(); // Convert to UTC
  if (formattedTime.isBefore(dayjs().utc())) {
    throw new AppError(C.REMINDER_TIME_IN_PAST, 400);
  }
  formattedTime = formattedTime.toDate().toISOString();
  const newReminder = await leadRepository.createCallReminderRecord({
    clientLeadId,
    userId,
    time: formattedTime,
    reminderReason,
  });
  await newCallNotification(clientLeadId, newReminder);
  let latestTwo = await leadRepository.findLatestCallReminders({ clientLeadId });
  await leadRepository.touchLead({ id: clientLeadId });
  return { latestTwo, newReminder };
}

export async function createMeetingReminder({
  clientLeadId,
  userId,
  time,
  reminderReason,
  isAdmin,
  adminId,
  type,
  currentUser,
}) {
  if (
    currentUser.role === "THREE_D_DESIGNER" ||
    currentUser.role === "TWO_D_DESIGNER"
  ) {
    throw new AppError(C.MEETING_NOT_ALLOWED_FOR_ROLE, 403);
  }
  const userTimezone = dayjs.tz.guess(); // Detect user's timezone

  let formattedTime = dayjs(time).tz(userTimezone).utc();
  if (formattedTime.isBefore(dayjs().utc())) {
    throw new AppError(C.REMINDER_TIME_IN_PAST, 400);
  }
  formattedTime = formattedTime.toDate().toISOString();
  const submittedTime = dayjs(formattedTime); // already UTC ISO

  const minTime = submittedTime.subtract(15, "minute").toISOString();
  const maxTime = submittedTime.add(15, "minute").toISOString();
  const data = { clientLeadId, userId, time: formattedTime, reminderReason };

  if (adminId) {
    const matchingSlot = await leadRepository.findMatchingAvailableSlot({
      adminId,
      minTime,
      maxTime,
    });
    if (!matchingSlot) {
      throw new AppError(C.NO_AVAILABLE_SLOT, 400);
    }
    data.time = matchingSlot.startTime;
    data.availableSlotId = matchingSlot.id;
  }

  if (isAdmin) {
    data.isAdmin = true;
  }
  if (adminId) {
    data.adminId = Number(adminId);
  }
  if (type) {
    data.type = type;
  }
  const newReminder = await leadRepository.createMeetingReminderRecord({ data });
  if (newReminder.availableSlotId) {
    await leadRepository.bookAvailableSlot({
      id: newReminder.availableSlotId,
      meetingReminderId: newReminder.id,
    });
  }
  await newCallNotification(clientLeadId, newReminder);
  let latestTwo = await leadRepository.findLatestMeetingReminders({
    clientLeadId,
  });
  await leadRepository.touchLead({ id: clientLeadId });
  return { latestTwo, newReminder };
}

export async function createMeetingReminderWithToken({
  clientLeadId,
  userId,
  reminderReason,
  isAdmin,
  adminId,
  type,
  currentUser,
}) {
  if (
    currentUser.role === "THREE_D_DESIGNER" ||
    currentUser.role === "TWO_D_DESIGNER"
  ) {
    throw new AppError(C.MEETING_NOT_ALLOWED_FOR_ROLE, 403);
  }
  const token = uuidv4();

  const data = { clientLeadId, userId, reminderReason, token };

  if (isAdmin) {
    data.isAdmin = true;
  }
  if (adminId) {
    data.adminId = Number(adminId);
    const today = dayjs().startOf("day").toDate();
    const halfNextMonth = dayjs()
      .add(1, "month")
      .startOf("month")
      .add(14, "day")
      .endOf("day")
      .toDate();

    const availableSlot = await leadRepository.findAvailableSlotInRange({
      adminId,
      from: today,
      to: halfNextMonth,
    });

    if (!availableSlot) {
      throw new AppError(C.NO_AVAILABLE_SLOT, 400);
    }
  }
  if (type) {
    data.type = type;
  }

  const newReminder = await leadRepository.createMeetingReminderTokenRecord({
    data,
  });
  let latestTwo = await leadRepository.findLatestMeetingReminders({
    clientLeadId,
  });
  await leadRepository.touchLead({ id: clientLeadId });
  return { latestTwo, newReminder };
}

export async function createPriceOffer({ clientLeadId, userId, priceOffer }) {
  if (priceOffer.minPrice > priceOffer.maxPrice) {
    throw new AppError(C.PRICE_OFFER_RANGE_INVALID, 400);
  }
  const newPrice = await leadRepository.createPriceOfferRecord({
    clientLeadId,
    userId,
    priceOffer,
  });
  await leadRepository.touchLead({ id: clientLeadId });
  await newPriceOffer(clientLeadId, newPrice);
  return newPrice;
}

export async function createFile({
  clientLeadId,
  url,
  name,
  description,
  userId,
}) {
  if (!url || !name) {
    throw new AppError(C.FILE_FIELDS_REQUIRED, 400);
  }
  const data = {
    name,
    clientLeadId,
    url,
    description,
  };
  if (userId) {
    data.userId = Number(userId);
  }
  const file = await leadRepository.createFileRecord({ data });
  if (file.clientLeadId) {
    const teleChannel = await getChannelEntitiyByTeleRecordAndLeadId({
      clientLeadId: Number(file.clientLeadId),
    });
    if (teleChannel) {
      await uploadAnAttachment(file, teleChannel);
    }
  }
  if (userId !== null) {
    await newFileUploaded(clientLeadId, data, userId);
  }
  await leadRepository.touchLead({ id: clientLeadId });
  return { ...file, name, url, description, isUserFile: userId !== null };
}

export async function updateCallReminderStatus({
  reminderId,
  currentUser,
  status,
  callResult = null,
}) {
  if (currentUser.role !== "ADMIN" && currentUser.role !== "SUPER_ADMIN") {
    const callReminder = await leadRepository.findCallReminderOwner({
      reminderId,
    });
    if (callReminder.user.id !== currentUser.id) {
      throw new AppError(C.LEAD_MUTATE_DENIED, 403);
    }
  }
  const updatedReminder = await leadRepository.updateCallReminderStatusRecord({
    reminderId,
    status,
    callResult: status === "DONE" ? callResult : "Missed call",
  });
  await leadRepository.touchLead({ id: updatedReminder.clientLeadId });
  await updateCallNotification(
    updatedReminder.clientLeadId,
    updatedReminder,
    currentUser.id
  );
  return updatedReminder;
}

export async function updateMeetingReminderStatus({
  reminderId,
  currentUser,
  status,
  meetingResult = null,
}) {
  if (
    currentUser.role === "THREE_D_DESIGNER" ||
    currentUser.role === "TWO_D_DESIGNER"
  ) {
    throw new AppError(C.MEETING_NOT_ALLOWED_FOR_ROLE, 403);
  }

  if (currentUser.role !== "ADMIN" && currentUser.role !== "SUPER_ADMIN") {
    const meetingReminder = await leadRepository.findMeetingReminderOwner({
      reminderId,
    });
    if (meetingReminder.user.id !== currentUser.id) {
      throw new AppError(C.LEAD_MUTATE_DENIED, 403);
    }
  }
  const updatedReminder = await leadRepository.updateMeetingReminderStatusRecord({
    reminderId,
    status,
    meetingResult: status === "DONE" ? meetingResult : "Missed Meeting",
  });
  await leadRepository.touchLead({ id: updatedReminder.clientLeadId });
  await updateMettingNotification(
    updatedReminder.clientLeadId,
    updatedReminder,
    currentUser.id
  );
  return updatedReminder;
}

export const getCallReminders = async (searchParams) => {
  const staffFilter = searchParams.staffId
    ? { userId: Number(searchParams.staffId) }
    : {};

  try {
    const callReminders = await leadRepository.findInProgressCallReminders({
      staffFilter,
    });

    return callReminders;
  } catch (error) {
    console.error("Error fetching call reminders:", error);
    throw error;
  }
};
