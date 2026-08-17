// calendar/google usecase — orchestration ONLY. Provider token exchange/refresh/revoke logic
// stays in the Google infra client; this layer owns the self-scoped OAuth state lifecycle and
// maps provider failures to stable application codes. Tokens are never logged or returned.
//
// All Google actions are inherently SELF-SCOPED: they act on the authenticated caller's own
// user id (req.auth.id) — exactly as legacy used getCurrentUser(req).id. OAuth state is an
// expiring, single-use Redis nonce bound to that authenticated user; the callback never trusts
// a user id supplied by the browser.
import { AppError } from "../../../shared/errors/AppError.js";
import { calendarMessagesCodes } from "@dms/shared";
import { googleCalendarRepository } from "./google.repo.js";
// The Google OAuth/Calendar side-effect flow lives in the INFRA client
// (infra/google/google-calendar.client.js). isGoogleCalendarConnected — and the resync loop it
// invokes — stay in that infra client (see its header note); the usecase only invokes them.
import {
  getAuthUrl,
  handleOAuthCallback,
  disconnectGoogleCalendar,
  isGoogleCalendarConnected,
} from "../../../infra/google/google-calendar.client.js";
import {
  consumeGoogleOAuthState,
  issueGoogleOAuthState,
} from "./google-oauth-state.cache.js";

class GoogleCalendarUsecase {
  // GET/POST /google/connect — if already connected, legacy returned 400; otherwise it
  // returns the OAuth authorize URL. The response key differs between the legacy GET
  // (`authUrl`) and POST (`redirectUrl`) handlers — preserved by the controller.
  async connect({ authUser }) {
    const connected = await isGoogleCalendarConnected(authUser.id);
    if (connected) {
      throw new AppError({ code: calendarMessagesCodes.GOOGLE_ALREADY_CONNECTED, statusCode: 400 });
    }
    const state = await issueGoogleOAuthState({ userId: authUser.id });
    const authUrl = await getAuthUrl(state);
    return { isConnected: false, authUrl };
  }

  // The authenticated session is the only user identity used for the token write. State only
  // proves that this same user initiated the flow, and is atomically consumed before exchange.
  async handleCallback({ code, state, authUser }) {
    const validState = await consumeGoogleOAuthState({
      state,
      userId: authUser.id,
    });
    if (!validState) {
      throw new AppError({
        code: calendarMessagesCodes.GOOGLE_CALLBACK_INVALID,
        statusCode: 400,
      });
    }

    try {
      return await handleOAuthCallback(code, authUser.id);
    } catch {
      throw new AppError({
        code: calendarMessagesCodes.CALENDAR_FETCH_FAILED,
        statusCode: 502,
      });
    }
  }

  // POST /google/disconnect — revoke + clear the caller's Google connection.
  async disconnect({ authUser }) {
    await disconnectGoogleCalendar(authUser.id);
    return true;
  }

  // During the additive migration window, encrypted credential presence is authoritative and
  // legacy refresh-token presence remains a temporary fallback. No stored credential leaves.
  async getGoogleStatus({ authUser }) {
    const userData = await googleCalendarRepository.findConnectionStatus({ userId: authUser.id });
    return {
      connected: Boolean(
        userData?.googleEncryptedCredential || userData?.googleRefreshToken,
      ),
      calendarId: userData?.googleCalendarId ?? null,
      tokenExpired: userData?.googleTokenExpiresAt
        ? new Date(userData.googleTokenExpiresAt) < new Date()
        : null,
    };
  }
}

export const googleCalendarUsecase = new GoogleCalendarUsecase();
export { GoogleCalendarUsecase };
