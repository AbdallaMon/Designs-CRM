// calendar/google repository — Prisma I/O ONLY. The Google OAuth/token logic lives in the
// legacy googleCalendar service (getAuthUrl / handleOAuthCallback / disconnectGoogleCalendar
// / isGoogleCalendarConnected) and is invoked from the usecase via lazy adapters — that
// service owns ALL token handling and is behavior-frozen. The ONLY direct Prisma here is the
// connection-STATUS read that the legacy `/status` route performed inline.
//
// SECURITY: this select reads googleRefreshToken SOLELY so the usecase can derive the
// `connected` boolean (Boolean(refreshToken) — presence of a stored refresh token means an
// established Google connection). The raw token NEVER escapes the usecase: the usecase maps
// this row to { connected, calendarId, tokenExpired } and drops the token before it reaches
// the response/dto. The token value is never returned from `/status` and never logged.
// (googleCalendarId / googleTokenExpiresAt are non-secret connection metadata.)
// Note: the frozen schema has NO `googleCalendarConnected` column — connection state is
// derived from googleRefreshToken presence, not stored as a flag.
import prisma from "../../../infra/prisma/prisma.js";

class GoogleCalendarRepository {
  model = prisma.user;

  // Legacy GET /google/status — connection metadata + refresh-token presence (token used
  // ONLY by the usecase to derive `connected`; never returned/logged).
  findConnectionStatus({ userId }) {
    return prisma.user.findUnique({
      where: { id: Number(userId) },
      select: {
        googleRefreshToken: true,
        googleCalendarId: true,
        googleTokenExpiresAt: true,
      },
    });
  }
}

export const googleCalendarRepository = new GoogleCalendarRepository();
export { GoogleCalendarRepository };
