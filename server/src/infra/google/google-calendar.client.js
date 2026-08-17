// Google Calendar INFRA client — third-party OAuth/Calendar integration. OAuth2Client instances
// are deliberately request/user scoped so credentials can never bleed across concurrent users.
//
// NOTE (future repo target): the DB writes inside handleOAuthCallback / disconnectGoogleCalendar
// / createCalendarEvent / updateCalendarEvent (user.update, meetingReminder.update) remain inline
// here to keep this a strictly behavior-preserving MOVE. They are the natural candidates for a
// future googleCalendar repo once behavior parity can be re-verified; do NOT split them now.
//
// resyncMeetingRemindersWithGoogleCalendar stays here (not in the google usecase) because
// isGoogleCalendarConnected calls it as part of the connection check; keeping the call chain
// verbatim preserves the exact side-effect ordering the google usecase's `connect` relies on.
import { google } from "googleapis";
import prisma from "../prisma/prisma.js";
import { integrationCredentialEncryption } from "../security/integration-credential-encryption.js";
import { googleCalendarRepository } from "../../modules/calendar/google/google.repo.js";

function toGoogleCredentialView(stored) {
  if (!stored) return null;
  if (stored.googleEncryptedCredential) {
    const credentials = integrationCredentialEncryption.decrypt({
      ciphertext: stored.googleEncryptedCredential.ciphertext,
      metadata: stored.googleEncryptedCredential,
    });
    return {
      googleRefreshToken: credentials.refreshToken ?? null,
      googleAccessToken: credentials.accessToken ?? null,
      googleTokenExpiresAt: stored.googleTokenExpiresAt,
      googleCalendarId: stored.googleCalendarId,
    };
  }
  return stored;
}

async function readGoogleCredentials(userId) {
  const stored = await googleCalendarRepository.findCredentialStorage({ userId });
  return toGoogleCredentialView(stored);
}

async function writeGoogleCredentials({
  userId,
  refreshToken,
  accessToken,
  tokenExpiresAt,
  calendarId,
}) {
  const encrypted = integrationCredentialEncryption.encrypt({
    refreshToken: refreshToken ?? null,
    accessToken: accessToken ?? null,
  });
  return googleCalendarRepository.replaceEncryptedCredentials({
    userId,
    ciphertext: encrypted.ciphertext,
    metadata: encrypted.metadata,
    tokenExpiresAt,
    calendarId,
  });
}

export function createGoogleOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI,
  );
}

/**
 * Generate OAuth2 URL for user to authorize
 */
export function getAuthUrl(state) {
  const scopes = ["https://www.googleapis.com/auth/calendar"];
  const oauth2Client = createGoogleOAuthClient();

  return oauth2Client.generateAuthUrl({
    access_type: "offline", // Required for refresh token
    scope: scopes,
    state,
    prompt: "consent", // Force consent screen to get refresh token
  });
}

/**
 * Exchange authorization code for tokens and save to DB
 */
export async function handleOAuthCallback(code, userId) {
  const oauth2Client = createGoogleOAuthClient();
  try {
    const { tokens } = await oauth2Client.getToken(code);
    await writeGoogleCredentials({
      userId,
      refreshToken: tokens.refresh_token,
      accessToken: tokens.access_token,
      tokenExpiresAt: new Date(tokens.expiry_date),
      calendarId: null,
    });

    // Fetch primary calendar ID
    oauth2Client.setCredentials(tokens);
    const calendar = google.calendar({ version: "v3", auth: oauth2Client });
    const calendarList = await calendar.calendarList.list();
    const primaryCalendar = calendarList.data.items.find((cal) => cal.primary);

    if (primaryCalendar) {
      await googleCalendarRepository.updateCalendarIdentity({
        userId,
        calendarId: primaryCalendar.id,
        googleEmail: primaryCalendar.summary,
      });
    }

    return { success: true };
  } catch {
    throw new Error("GOOGLE_OAUTH_EXCHANGE_FAILED");
  }
}

/**
 * Get authenticated calendar client for user
 */
export async function getCalendarClient(userId) {
  const user = await readGoogleCredentials(userId);

  if (!user.googleRefreshToken) {
    throw new Error("Google Calendar not connected");
  }

  const oauth2Client = createGoogleOAuthClient();

  // Check if token is expired
  const now = new Date();
  const expiresAt = new Date(user.googleTokenExpiresAt);

  if (expiresAt <= now) {
    // Refresh token
    oauth2Client.setCredentials({
      refresh_token: user.googleRefreshToken,
    });

    const { credentials } = await oauth2Client.refreshAccessToken();

    await writeGoogleCredentials({
      userId,
      refreshToken: user.googleRefreshToken,
      accessToken: credentials.access_token,
      tokenExpiresAt: new Date(credentials.expiry_date),
      calendarId: user.googleCalendarId,
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
    return;
  }

  try {
    const calendar = await getCalendarClient(userId);
    const user = await googleCalendarRepository.findCalendarIdentity({ userId });
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
  } catch {
    console.error("GOOGLE_CALENDAR_EVENT_CREATE_FAILED");
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
    const user = await googleCalendarRepository.findCalendarIdentity({ userId });

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
  } catch {
    console.error("GOOGLE_CALENDAR_EVENT_UPDATE_FAILED");
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
    const user = await googleCalendarRepository.findCalendarIdentity({ userId });

    await calendar.events.delete({
      calendarId: user.googleCalendarId || "primary",
      eventId: meetingReminder.googleEventId,
    });
  } catch {
    console.error("GOOGLE_CALENDAR_EVENT_DELETE_FAILED");
  }
}

/**
 * Disconnect Google Calendar
 */
export async function disconnectGoogleCalendar(userId) {
  const user = await readGoogleCredentials(userId);

  // Revoke token with Google
  if (user.googleRefreshToken || user.googleAccessToken) {
    try {
      const oauth2Client = createGoogleOAuthClient();
      oauth2Client.setCredentials({
        access_token: user.googleAccessToken,
        refresh_token: user.googleRefreshToken,
      });
      await oauth2Client.revokeCredentials();
    } catch {
      console.error("GOOGLE_CREDENTIAL_REVOKE_FAILED");
      // Continue with local cleanup even if revoke fails
    }
  }

  await googleCalendarRepository.clearCredentials({ userId });
}

export async function isGoogleCalendarConnected(userId) {
  try {
    const isConnected = await getCalendarClient(userId);
    if (isConnected) {
      return await resyncMeetingRemindersWithGoogleCalendar(Number(userId));
    }
    return false;
  } catch {
    console.error("GOOGLE_CALENDAR_CONNECTION_CHECK_FAILED");
    return false;
  }
}
export async function resyncMeetingRemindersWithGoogleCalendar(userId) {
  // check meeting that are today or comming and has an availableSLot and no googleEventId
  const now = new Date();
  const meetingReminders = await prisma.meetingReminder.findMany({
    where: {
      time: {
        gte: now,
      },
      OR: [{ userId: userId }, { adminId: userId }],
      availableSlot: {
        isNot: null,
      },
      googleEventId: null,
    },
  });
  for (const meeting of meetingReminders) {
    try {
      await createCalendarEvent(meeting);
    } catch {
      console.error("GOOGLE_CALENDAR_RESYNC_FAILED");
    }
  }
  return true;
}
