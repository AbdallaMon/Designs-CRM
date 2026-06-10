// calendar/google usecase — orchestration ONLY. The Google OAuth/Calendar token flow is
// owned by the legacy googleCalendar service (services/main/calendar/googleCalendar.js) and
// is BEHAVIOR-FROZEN: this usecase only invokes it via lazy adapters; it never duplicates
// the token exchange/refresh/revoke logic and never logs or returns access/refresh tokens.
//
// All Google actions are inherently SELF-SCOPED: they act on the authenticated caller's own
// user id (req.auth.id) — exactly as legacy used getCurrentUser(req).id. The OAuth callback
// is the one PUBLIC action (Google redirects the browser to it with ?code&state); it is
// kept ungated and is handled in the controller (it performs an HTTP redirect, not an
// envelope response) — the usecase exposes the callback handler so the controller stays thin.
import { AppError } from "../../../shared/errors/AppError.js";
import { calendarMessagesCodes as C } from "@dms/shared";
import { googleCalendarRepository } from "./google.repository.js";

const legacyDefaults = {
  getAuthUrl: (userId) =>
    import("../../../../services/main/calendar/googleCalendar.js").then((m) => m.getAuthUrl(userId)),
  handleOAuthCallback: (code, state) =>
    import("../../../../services/main/calendar/googleCalendar.js").then((m) =>
      m.handleOAuthCallback(code, state),
    ),
  disconnectGoogleCalendar: (userId) =>
    import("../../../../services/main/calendar/googleCalendar.js").then((m) =>
      m.disconnectGoogleCalendar(userId),
    ),
  isGoogleCalendarConnected: (userId) =>
    import("../../../../services/main/calendar/googleCalendar.js").then((m) =>
      m.isGoogleCalendarConnected(userId),
    ),
};

export class GoogleCalendarUsecase {
  constructor(repository, legacy = {}) {
    this.repo = repository;
    this.legacy = { ...legacyDefaults, ...legacy };
  }

  // GET/POST /google/connect — if already connected, legacy returned 400; otherwise it
  // returns the OAuth authorize URL. The response key differs between the legacy GET
  // (`authUrl`) and POST (`redirectUrl`) handlers — preserved by the controller.
  async connect({ authUser }) {
    const connected = await this.legacy.isGoogleCalendarConnected(authUser.id);
    if (connected) {
      throw new AppError(C.GOOGLE_ALREADY_CONNECTED, 400);
    }
    const authUrl = await this.legacy.getAuthUrl(authUser.id);
    return { isConnected: false, authUrl };
  }

  // GET /google/callback — Google redirects here with ?code&state (state = userId). PUBLIC.
  // Returns nothing meaningful; the controller redirects on success/failure exactly as
  // legacy did. We pass code/state straight to the frozen service (which exchanges the code
  // for tokens). NEVER log code/state/tokens here.
  handleCallback({ code, state }) {
    return this.legacy.handleOAuthCallback(code, state);
  }

  // POST /google/disconnect — revoke + clear the caller's Google connection.
  async disconnect({ authUser }) {
    await this.legacy.disconnectGoogleCalendar(authUser.id);
    return true;
  }

  // GET /google/status — connection metadata only. The frozen schema has no
  // `googleCalendarConnected` flag, so `connected` is DERIVED from the presence of a stored
  // refresh token (Boolean(googleRefreshToken)) — matching the legacy intent where a Google
  // client is only usable once tokens exist. SECURITY: the refresh token is read here ONLY to
  // compute the boolean; it is dropped immediately and NEVER returned or logged. Only
  // { connected, calendarId, tokenExpired } leaves this method.
  async status({ authUser }) {
    const userData = await this.repo.findConnectionStatus({ userId: authUser.id });
    return {
      connected: Boolean(userData?.googleRefreshToken),
      calendarId: userData?.googleCalendarId ?? null,
      tokenExpired: userData?.googleTokenExpiresAt
        ? new Date(userData.googleTokenExpiresAt) < new Date()
        : null,
    };
  }
}

export const googleCalendarUsecase = new GoogleCalendarUsecase(googleCalendarRepository);
