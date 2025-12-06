import prisma from "../../../prisma/prisma.js";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";
dayjs.extend(utc);
dayjs.extend(timezone);
import {
  newCallNotification,
  newFileUploaded,
  newNoteNotification,
  newPriceOffer,
  updateCallNotification,
  updateMettingNotification,
} from "../../notification.js";
import { updateLead } from "../utility/utility.js";
import { v4 as uuidv4 } from "uuid";
import {
  getChannelEntitiyByTeleRecordAndLeadId,
  uploadAnAttachment,
  uploadANote,
} from "../../telegram/telegram-functions.js";

export async function createNote({ clientLeadId, userId, content }) {
  if (!content.trim()) {
    throw new Error("Note content cannot be empty.");
  }

  const newNote = await prisma.note.create({
    data: {
      content,
      clientLeadId,
      userId,
    },
    select: {
      id: true,
      createdAt: true,
      user: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
  if (clientLeadId) {
    const teleChannel = await getChannelEntitiyByTeleRecordAndLeadId({
      clientLeadId: Number(clientLeadId),
    });
    const note = await prisma.note.findUnique({
      where: {
        id: newNote.id,
      },
      include: {
        user: true,
      },
    });
    if (teleChannel) {
      await uploadANote(note, teleChannel);
    }
  }
  await updateLead(clientLeadId);
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
    throw new Error("The reminder time must be in the future.");
  }
  formattedTime = formattedTime.toDate().toISOString();
  const newReminder = await prisma.callReminder.create({
    data: {
      clientLeadId,
      userId,
      time: formattedTime,
      reminderReason,
    },
    select: {
      id: true,
      time: true,
      status: true,
      reminderReason: true,
      callResult: true,
      userId: true,
      user: {
        select: { name: true },
      },
    },
  });
  await newCallNotification(clientLeadId, newReminder);
  let latestTwo = await prisma.callReminder.findMany({
    where: {
      clientLeadId,
    },
    orderBy: { time: "desc" },
    take: 2,
  });
  await updateLead(clientLeadId);
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
    throw new Error("You are not allow to create meeting");
  }
  const userTimezone = dayjs.tz.guess(); // Detect user's timezone

  let formattedTime = dayjs(time).tz(userTimezone).utc();
  if (formattedTime.isBefore(dayjs().utc())) {
    throw new Error("The reminder time must be in the future.");
  }
  formattedTime = formattedTime.toDate().toISOString();
  const submittedTime = dayjs(formattedTime); // already UTC ISO

  const minTime = submittedTime.subtract(15, "minute").toISOString();
  const maxTime = submittedTime.add(15, "minute").toISOString();
  const data = { clientLeadId, userId, time: formattedTime, reminderReason };

  if (adminId) {
    const matchingSlot = await prisma.availableSlot.findFirst({
      where: {
        isBooked: false,
        startTime: {
          gte: minTime,
          lte: maxTime,
        },
        availableDay: {
          userId: Number(adminId),
        },
      },
    });
    if (!matchingSlot) {
      throw new Error("No available time for this admin in the current dates");
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
  const newReminder = await prisma.meetingReminder.create({
    data,
    select: {
      id: true,
      time: true,
      status: true,
      reminderReason: true,
      meetingResult: true,
      userId: true,
      type: true,
      isAdmin: true,
      adminId: true,
      token: true,
      availableSlotId: true,
      admin: {
        select: {
          name: true,
        },
      },
      user: {
        select: { name: true },
      },
    },
  });
  if (newReminder.availableSlotId) {
    await prisma.availableSlot.update({
      where: { id: newReminder.availableSlotId },
      data: { isBooked: true, meetingReminderId: newReminder.id },
    });
  }
  await newCallNotification(clientLeadId, newReminder);
  let latestTwo = await prisma.meetingReminder.findMany({
    where: {
      clientLeadId,
    },
    orderBy: { time: "desc" },
    take: 2,
  });
  await updateLead(clientLeadId);
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
    throw new Error("You are not allow to create meeting");
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

    const availableSlot = await prisma.availableSlot.findFirst({
      where: {
        isBooked: false,
        startTime: {
          gte: today,
          lte: halfNextMonth,
        },
        availableDay: {
          userId: Number(adminId),
        },
      },
    });

    if (!availableSlot) {
      throw new Error(
        "No available slots found for this admin in the coming days ,ask admin to add available slots"
      );
    }
  }
  if (type) {
    data.type = type;
  }

  const newReminder = await prisma.meetingReminder.create({
    data,
    select: {
      id: true,
      time: true,
      status: true,
      reminderReason: true,
      meetingResult: true,
      userId: true,
      type: true,
      isAdmin: true,
      adminId: true,
      token: true,
      admin: {
        select: {
          name: true,
        },
      },
      user: {
        select: { name: true },
      },
    },
  });
  let latestTwo = await prisma.meetingReminder.findMany({
    where: {
      clientLeadId,
    },
    orderBy: { time: "desc" },
    take: 2,
  });
  await updateLead(clientLeadId);
  return { latestTwo, newReminder };
}
export async function createPriceOffer({ clientLeadId, userId, priceOffer }) {
  if (priceOffer.minPrice > priceOffer.maxPrice) {
    throw new Error("End price must be bigger or equal to start price");
  }
  const newPrice = await prisma.PriceOffers.create({
    data: {
      clientLeadId,
      userId,

      url: priceOffer.url,
      note: priceOffer.note,
    },
    select: {
      id: true,
      createdAt: true,
      minPrice: true,
      maxPrice: true,
      note: true,
      url: true,
      user: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
  await updateLead(clientLeadId);
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
    throw new Error("Fill all the fields please");
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
  const file = await prisma.file.create({
    data,
    select: {
      id: true,
      createdAt: true,
      clientLeadId: true,
      description: true,
      url: true,
      name: true,
      isUserFile: true,
      user: {
        select: {
          name: true,
          id: true,
          email: true,
          telegramUsername: true,
        },
      },
    },
  });
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
  await updateLead(clientLeadId);
  return { ...file, name, url, description, isUserFile: userId !== null };
}

export async function updateCallReminderStatus({
  reminderId,
  currentUser,
  status,
  callResult = null,
}) {
  if (currentUser.role !== "ADMIN" && currentUser.role !== "SUPER_ADMIN") {
    const callReminder = await prisma.callReminder.findUnique({
      where: {
        id: reminderId,
      },
      select: {
        user: {
          select: {
            id: true,
          },
        },
      },
    });
    if (callReminder.user.id !== currentUser.id) {
      throw new Error(
        "You are not allowed to update this call result ask admin to do that"
      );
    }
  }
  const updatedReminder = await prisma.callReminder.update({
    where: { id: reminderId },
    data: {
      status,
      callResult: status === "DONE" ? callResult : "Missed call",
      updatedAt: new Date(),
    },
    select: {
      id: true,
      time: true,
      status: true,
      reminderReason: true,
      callResult: true,
      userId: true,
      clientLeadId: true,
      updatedAt: true,
      user: {
        select: { name: true },
      },
    },
  });
  await updateLead(updatedReminder.clientLeadId);
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
    throw new Error("You are not allow to update this meeting");
  }

  if (currentUser.role !== "ADMIN" && currentUser.role !== "SUPER_ADMIN") {
    const meetingReminder = await prisma.meetingReminder.findUnique({
      where: {
        id: reminderId,
      },
      select: {
        user: {
          select: {
            id: true,
          },
        },
      },
    });
    if (meetingReminder.user.id !== currentUser.id) {
      throw new Error(
        "You are not allowed to update this call result ask admin to do that"
      );
    }
  }
  const updatedReminder = await prisma.meetingReminder.update({
    where: { id: reminderId },
    data: {
      status,
      meetingResult: status === "DONE" ? meetingResult : "Missed Meeting",
      updatedAt: new Date(),
    },
    select: {
      id: true,
      time: true,
      status: true,
      reminderReason: true,
      meetingResult: true,
      userId: true,
      clientLeadId: true,
      token: true,
      updatedAt: true,
      user: {
        select: { name: true },
      },
    },
  });
  await updateLead(updatedReminder.clientLeadId);
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
    const callReminders = await prisma.callReminder.findMany({
      where: {
        clientLead: {
          status: {
            notIn: ["CONVERTED", "ON_HOLD", "FINALIZED", "REJECTED"],
          },
          ...staffFilter,
        },
        status: "IN_PROGRESS",
      },
      include: {
        clientLead: {
          select: {
            client: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    return callReminders;
  } catch (error) {
    console.error("Error fetching call reminders:", error);
    throw new Error("Unable to fetch call reminders");
  }
};
