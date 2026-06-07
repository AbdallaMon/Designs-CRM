// calendar/google repository — Prisma I/O ONLY. The Google OAuth/token logic lives in the
// legacy googleCalendar service (getAuthUrl / handleOAuthCallback / disconnectGoogleCalendar
// / isGoogleCalendarConnected) and is invoked from the usecase via lazy adapters — that
// service owns ALL token handling and is behavior-frozen. The ONLY direct Prisma here is the
// connection-STATUS read that the legacy `/status` route performed inline.
//
// SECURITY: this select returns ONLY non-secret connection metadata
// (googleCalendarConnected / googleCalendarId / googleTokenExpiresAt). It deliberately does
// NOT select googleAccessToken / googleRefreshToken — tokens are NEVER read into or returned
// from this surface, matching the legacy `/status` handler exactly.
import prisma from "../../../infra/prisma/prisma.js";

class GoogleCalendarRepository {
  model = prisma.user;

  // Legacy GET /google/status — connection metadata only (no tokens).
  findConnectionStatus({ userId }) {
    return prisma.user.findUnique({
      where: { id: Number(userId) },
      select: {
        googleCalendarConnected: true,
        googleCalendarId: true,
        googleTokenExpiresAt: true,
      },
    });
  }
}

export const googleCalendarRepository = new GoogleCalendarRepository();
export { GoogleCalendarRepository };
