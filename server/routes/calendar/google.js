import express from "express";
import {
  getAuthUrl,
  handleOAuthCallback,
  disconnectGoogleCalendar,
  isGoogleCalendarConnected,
  resyncMeetingRemindersWithGoogleCalendar,
} from "../../services/main/calendar/googleCalendar.js";
import { getCurrentUser } from "../../services/main/utility/utility.js";

const router = express.Router();

/**
 * GET /api/shared/calendar/google/connect
 * Get OAuth URL for user to authorize
 */
router.get("/connect", async (req, res) => {
  try {
    const user = await getCurrentUser(req);
    const isConnected = await isGoogleCalendarConnected(user.id);
    if (isConnected) {
      return res
        .status(400)
        .json({ message: "Google Calendar is already connected" });
    }
    const authUrl = getAuthUrl(user.id);
    res.status(200).json({
      data: { isConnected: false, authUrl },
      message: "Redirect user to this URL",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * GET /api/shared/calendar/google/callback
 * OAuth2 callback handler
 */
router.get("/callback", async (req, res) => {
  const { code, state } = req.query; // state = userId
  if (!code || !state) {
    return res.status(400).send("Missing authorization code or state");
  }

  try {
    await handleOAuthCallback(code, state);
    await resyncMeetingRemindersWithGoogleCalendar();
    // res.redirect("https://calendar.google.com/calendar");
    res.redirect(`${process.env.OLDORIGIN}/dashboard?googleAuthSuccess=1`);
  } catch (error) {
    console.error("Callback error:", error);
    res.redirect(
      `${process.env.OLDORIGIN}/dashboard?googleAuthError=${encodeURIComponent(
        error.message
      )}`
    );
  }
});

/**
 * POST /api/shared/calendar/google/disconnect
 * Disconnect Google Calendar
 */
router.post("/disconnect", async (req, res) => {
  try {
    const user = await getCurrentUser(req);
    await disconnectGoogleCalendar(user.id);

    res.json({ message: "Google Calendar disconnected" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * GET /api/shared/calendar/google/status
 * Check if user has connected Google Calendar
 */
router.get("/status", async (req, res) => {
  try {
    const user = await getCurrentUser(req);
    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        googleCalendarConnected: true,
        googleCalendarId: true,
        googleTokenExpiresAt: true,
      },
    });

    res.json({
      data: {
        connected: userData.googleCalendarConnected,
        calendarId: userData.googleCalendarId,
        tokenExpired: userData.googleTokenExpiresAt
          ? new Date(userData.googleTokenExpiresAt) < new Date()
          : null,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
