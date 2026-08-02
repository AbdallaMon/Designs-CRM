// leads/lead — STAFF sub-resource orchestration (notes / call & meeting reminders /
// price offers / files). Extracted VERBATIM from lead.usecase.js (behavior-preserving;
// no logic/value change). Imported directly by lead.usecase.js; `getCallReminders`
// is re-exported from lead.usecase.js
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
import { leadsMessagesCodes } from "@dms/shared";

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
    throw new AppError({ code: leadsMessagesCodes.NOTE_CONTENT_EMPTY, statusCode: 400 });
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
    throw new AppError({ code: leadsMessagesCodes.REMINDER_TIME_IN_PAST, statusCode: 400 });
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
    currentUser.currentProfileKey === "DESIGNER_3D" ||
    currentUser.currentProfileKey === "DESIGNER_2D"
  ) {
    throw new AppError({ code: leadsMessagesCodes.MEETING_NOT_ALLOWED_FOR_ROLE, statusCode: 403 });
  }
  const userTimezone = dayjs.tz.guess(); // Detect user's timezone

  let formattedTime = dayjs(time).tz(userTimezone).utc();
  if (formattedTime.isBefore(dayjs().utc())) {
    throw new AppError({ code: leadsMessagesCodes.REMINDER_TIME_IN_PAST, statusCode: 400 });
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
      throw new AppError({ code: leadsMessagesCodes.NO_AVAILABLE_SLOT, statusCode: 400 });
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
    currentUser.currentProfileKey === "DESIGNER_3D" ||
    currentUser.currentProfileKey === "DESIGNER_2D"
  ) {
    throw new AppError({ code: leadsMessagesCodes.MEETING_NOT_ALLOWED_FOR_ROLE, statusCode: 403 });
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
      throw new AppError({ code: leadsMessagesCodes.NO_AVAILABLE_SLOT, statusCode: 400 });
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
    throw new AppError({ code: leadsMessagesCodes.PRICE_OFFER_RANGE_INVALID, statusCode: 400 });
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
    throw new AppError({ code: leadsMessagesCodes.FILE_FIELDS_REQUIRED, statusCode: 400 });
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

// Lead statuses on which closing the LAST touchpoint must plan the next one (spec
// 2026-07-15 §5.2 "required with escape"). Mirrors the cockpit's ACTIVE_STATUSES.
const NEXT_TOUCH_ACTIVE_STATUSES = [
  "IN_PROGRESS",
  "INTERESTED",
  "NEEDS_IDENTIFIED",
  "NEGOTIATING",
];

// Throw 422 NEXT_TOUCH_REQUIRED when marking DONE/MISSED would leave an ACTIVE lead
// with no future touchpoint and the caller planned neither a next touch nor an explicit
// no-follow-up. Runs BEFORE the status write so the 422 path is side-effect-free.
async function assertNextTouchPlanned({ clientLeadId, exclude, status, next, noFollowUp }) {
  if (status !== "DONE" && status !== "MISSED") return;
  if (next || noFollowUp) return;
  if (clientLeadId == null) return;
  const lead = await leadRepository.findLeadStatus({ id: clientLeadId });
  if (!lead || !NEXT_TOUCH_ACTIVE_STATUSES.includes(lead.status)) return;
  const hasFuture = await leadRepository.hasOtherFutureTouch({
    clientLeadId,
    now: new Date(),
    ...exclude,
  });
  if (!hasFuture) {
    throw new AppError({
      code: leadsMessagesCodes.NEXT_TOUCH_REQUIRED,
      statusCode: 422,
      reason:
        "closing the last touchpoint on an active lead — schedule the next touch or record why none is needed",
    });
  }
}

// Apply the planned follow-up after the status write: schedule the next call/meeting
// (reuses the create flows incl. their time-in-future validation + notifications) or
// persist the explicit no-follow-up reason as a lead note.
async function applyNextTouchPlan({ clientLeadId, currentUser, next, noFollowUp }) {
  if (clientLeadId == null) return;
  if (next) {
    if (next.type === "MEETING") {
      await createMeetingReminder({
        clientLeadId,
        userId: currentUser.id,
        time: next.time,
        reminderReason: next.reason,
        currentUser,
      });
    } else {
      await createCallReminder({
        clientLeadId,
        userId: currentUser.id,
        time: next.time,
        reminderReason: next.reason,
      });
    }
  } else if (noFollowUp?.reason) {
    await createNote({
      clientLeadId,
      userId: currentUser.id,
      content: `No follow-up planned: ${noFollowUp.reason}`,
    });
  }
}

export async function updateCallReminderStatus({
  reminderId,
  currentUser,
  status,
  callResult = null,
  next = null,
  noFollowUp = null,
}) {
  const callReminder = await leadRepository.findCallReminderOwner({
    reminderId,
  });
  if (!currentUser.isAdminTier) {
    if (callReminder.user.id !== currentUser.id) {
      throw new AppError({ code: leadsMessagesCodes.LEAD_MUTATE_DENIED, statusCode: 403 });
    }
  }
  await assertNextTouchPlanned({
    clientLeadId: callReminder?.clientLeadId ?? null,
    exclude: { excludeCallId: Number(reminderId) },
    status,
    next,
    noFollowUp,
  });
  const updatedReminder = await leadRepository.updateCallReminderStatusRecord({
    reminderId,
    status,
    callResult: status === "DONE" ? callResult : "Missed call",
  });
  await applyNextTouchPlan({
    clientLeadId: updatedReminder.clientLeadId,
    currentUser,
    next,
    noFollowUp,
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
  next = null,
  noFollowUp = null,
}) {
  if (
    currentUser.currentProfileKey === "DESIGNER_3D" ||
    currentUser.currentProfileKey === "DESIGNER_2D"
  ) {
    throw new AppError({ code: leadsMessagesCodes.MEETING_NOT_ALLOWED_FOR_ROLE, statusCode: 403 });
  }

  const meetingReminder = await leadRepository.findMeetingReminderOwner({
    reminderId,
  });
  if (!currentUser.isAdminTier) {
    if (meetingReminder.user.id !== currentUser.id) {
      throw new AppError({ code: leadsMessagesCodes.LEAD_MUTATE_DENIED, statusCode: 403 });
    }
  }
  await assertNextTouchPlanned({
    clientLeadId: meetingReminder?.clientLeadId ?? null,
    exclude: { excludeMeetingId: Number(reminderId) },
    status,
    next,
    noFollowUp,
  });
  const updatedReminder = await leadRepository.updateMeetingReminderStatusRecord({
    reminderId,
    status,
    meetingResult: status === "DONE" ? meetingResult : "Missed Meeting",
  });
  await applyNextTouchPlan({
    clientLeadId: updatedReminder.clientLeadId,
    currentUser,
    next,
    noFollowUp,
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
