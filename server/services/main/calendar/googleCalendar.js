import { google } from "googleapis";
import prisma from "../../../prisma/prisma.js";

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

/**
 * Generate OAuth2 URL for user to authorize
 */
export function getAuthUrl(userId) {
  const scopes = [
    "https://www.googleapis.com/auth/calendar",
    "https://www.googleapis.com/auth/calendar.events",
  ];

  return oauth2Client.generateAuthUrl({
    access_type: "offline", // Required for refresh token
    scope: scopes,
    state: userId.toString(), // Pass userId to retrieve after callback
    prompt: "consent", // Force consent screen to get refresh token
  });
}

/**
 * Exchange authorization code for tokens and save to DB
 */
export async function handleOAuthCallback(code, userId) {
  try {
    const { tokens } = await oauth2Client.getToken(code);
    console.log(tokens, "tokens");
    // Save tokens to database
    await prisma.user.update({
      where: { id: parseInt(userId) },
      data: {
        googleRefreshToken: tokens.refresh_token,
        googleAccessToken: tokens.access_token,
        googleTokenExpiresAt: new Date(tokens.expiry_date),
        googleCalendarId: null, // Will fetch from calendar API
      },
    });

    // Fetch primary calendar ID
    oauth2Client.setCredentials(tokens);
    const calendar = google.calendar({ version: "v3", auth: oauth2Client });
    const calendarList = await calendar.calendarList.list();
    const primaryCalendar = calendarList.data.items.find((cal) => cal.primary);

    if (primaryCalendar) {
      await prisma.user.update({
        where: { id: parseInt(userId) },
        data: {
          googleCalendarId: primaryCalendar.id,
          googleEmail: primaryCalendar.summary,
        },
      });
    }

    return { success: true };
  } catch (error) {
    console.error("OAuth callback error:", error);
    throw new Error("Failed to connect Google Calendar");
  }
}

/**
 * Get authenticated calendar client for user
 */
export async function getCalendarClient(userId) {
  const user = await prisma.user.findUnique({
    where: { id: parseInt(userId) },
    select: {
      googleRefreshToken: true,
      googleAccessToken: true,
      googleTokenExpiresAt: true,
    },
  });

  if (!user.googleRefreshToken) {
    throw new Error("Google Calendar not connected");
  }

  // Check if token is expired
  const now = new Date();
  const expiresAt = new Date(user.googleTokenExpiresAt);

  if (expiresAt <= now) {
    // Refresh token
    oauth2Client.setCredentials({
      refresh_token: user.googleRefreshToken,
    });

    const { credentials } = await oauth2Client.refreshAccessToken();

    // Update in DB
    await prisma.user.update({
      where: { id: parseInt(userId) },
      data: {
        googleAccessToken: credentials.access_token,
        googleTokenExpiresAt: new Date(credentials.expiry_date),
      },
    });

    oauth2Client.setCredentials(credentials);
  } else {
    // Use existing token
    oauth2Client.setCredentials({
      access_token: user.googleAccessToken,
      refresh_token: user.googleRefreshToken,
    });
  }

  return google.calendar({ version: "v3", auth: oauth2Client });
}

/**
 * Create Google Calendar event from MeetingReminder
 */
export async function createCalendarEvent(meetingReminder) {
  const userId = meetingReminder.userId || meetingReminder.adminId;

  if (!userId) {
    console.error("No userId for meeting reminder:", meetingReminder.id);
    return;
  }

  try {
    const calendar = await getCalendarClient(userId);
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { googleCalendarId: true },
    });
    const clientLead = await prisma.clientLead.findUnique({
      where: { id: meetingReminder.clientLeadId },
      select: {
        id: true,
        client: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
    const event = {
      summary: `Meeting with ${clientLead.client.name} , Client Lead #${meetingReminder.clientLeadId}`,
      description: meetingReminder.reminderReason || "Client meeting",
      start: {
        dateTime: meetingReminder.time.toISOString(),
        timeZone: meetingReminder.userTimezone || "UTC",
      },
      end: {
        dateTime: new Date(
          meetingReminder.time.getTime() + 60 * 60 * 1000
        ).toISOString(), // +1 hour
        timeZone: meetingReminder.userTimezone || "UTC",
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: "email", minutes: 24 * 60 }, // 1 day before
          { method: "popup", minutes: 30 },
        ],
      },
    };

    const response = await calendar.events.insert({
      calendarId: user.googleCalendarId || "primary",
      resource: event,
    });

    // Store Google event ID in MeetingReminder
    await prisma.meetingReminder.update({
      where: { id: meetingReminder.id },
      data: {
        googleEventId: response.data.id, // Need to add this field to schema
        googleCalendarSynced: true,
      },
    });

    return response.data;
  } catch (error) {
    console.error("Create calendar event error:", error);
    return;
  }
}

/**
 * Update Google Calendar event
 */
export async function updateCalendarEvent(meetingReminder) {
  const userId = meetingReminder.userId || meetingReminder.adminId;

  if (!userId || !meetingReminder.googleEventId) {
    return; // No event to update
  }

  try {
    const calendar = await getCalendarClient(userId);
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { googleCalendarId: true },
    });

    const event = {
      summary: `Meeting with Client Lead #${meetingReminder.clientLeadId}`,
      description: meetingReminder.reminderReason || "Client meeting",
      start: {
        dateTime: meetingReminder.time.toISOString(),
        timeZone: meetingReminder.userTimezone || "UTC",
      },
      end: {
        dateTime: new Date(
          meetingReminder.time.getTime() + 60 * 60 * 1000
        ).toISOString(),
        timeZone: meetingReminder.userTimezone || "UTC",
      },
    };

    await calendar.events.update({
      calendarId: user.googleCalendarId || "primary",
      eventId: meetingReminder.googleEventId,
      resource: event,
    });
  } catch (error) {
    console.error("Update calendar event error:", error);
  }
}

/**
 * Delete Google Calendar event
 */
export async function deleteCalendarEvent(meetingReminder) {
  const userId = meetingReminder.userId || meetingReminder.adminId;

  if (!userId || !meetingReminder.googleEventId) {
    return;
  }

  try {
    const calendar = await getCalendarClient(userId);
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { googleCalendarId: true },
    });

    await calendar.events.delete({
      calendarId: user.googleCalendarId || "primary",
      eventId: meetingReminder.googleEventId,
    });
  } catch (error) {
    console.error("Delete calendar event error:", error);
  }
}

/**
 * Disconnect Google Calendar
 */
export async function disconnectGoogleCalendar(userId) {
  await prisma.user.update({
    where: { id: parseInt(userId) },
    data: {
      googleRefreshToken: null,
      googleAccessToken: null,
      googleTokenExpiresAt: null,
      googleCalendarId: null,
    },
  });
}

export async function isGoogleCalendarConnected(userId) {
  const user = await prisma.user.findUnique({
    where: { id: parseInt(userId) },
    select: {
      googleRefreshToken: true,
      googleAccessToken: true,
      googleTokenExpiresAt: true,
    },
  });

  // Check if refresh token exists (user is connected)
  if (!user.googleRefreshToken) {
    return false;
  }

  const now = new Date();
  const expiresAt = new Date(user.googleTokenExpiresAt);
  const thirtyMinutesFromNow = new Date(now.getTime() + 30 * 60 * 1000); // 30 minutes
  // If token expires within 30 minutes, auto-refresh it
  if (expiresAt <= thirtyMinutesFromNow) {
    try {
      oauth2Client.setCredentials({
        refresh_token: user.googleRefreshToken,
      });

      const { credentials } = await oauth2Client.refreshAccessToken();

      // Update tokens in DB
      await prisma.user.update({
        where: { id: parseInt(userId) },
        data: {
          googleAccessToken: credentials.access_token,
          googleTokenExpiresAt: new Date(credentials.expiry_date),
        },
      });
    } catch (error) {
      console.error("Token refresh failed:", error);
      // If refresh fails, mark as disconnected
      await prisma.user.update({
        where: { id: parseInt(userId) },
        data: { googleRefreshToken: null },
      });
      return false;
    }
  }
  await resyncMeetingRemindersWithGoogleCalendar();
  return true;
}
export async function resyncMeetingRemindersWithGoogleCalendar() {
  // check meeting that are today or comming and has an availableSLot and no googleEventId
  const now = new Date();
  const meetingReminders = await prisma.meetingReminder.findMany({
    where: {
      time: {
        gte: now,
      },
      availableSlot: {
        isNot: null,
      },
      googleEventId: null,
    },
  });
  for (const meeting of meetingReminders) {
    try {
      await createCalendarEvent(meeting);
    } catch (e) {
      console.error("Resync meeting reminder error:", e);
    }
  }
}
