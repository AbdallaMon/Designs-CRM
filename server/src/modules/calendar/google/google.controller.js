// calendar/google controller — thin. The OAuth callback performs an HTTP REDIRECT (not an
// envelope response) exactly as legacy did, so it does not use the response helpers. The
// connect GET vs POST handlers preserve the legacy response key difference (authUrl vs
// redirectUrl). Tokens/secrets are NEVER logged or returned anywhere here.
import { ok, deleted } from "../../../shared/http/response.js";
import { calendarMessagesCodes, messagesNames } from "@dms/shared";
import { googleCalendarUsecase } from "./google.usecase.js";

const TK = messagesNames.calendarMessages;

class GoogleCalendarController {
  // GET /google/connect — legacy returned { isConnected:false, authUrl }.
  async connectGet(req, res) {
    const data = await googleCalendarUsecase.connect({ authUser: req.auth });
    return ok(res, data, calendarMessagesCodes.GOOGLE_AUTH_URL_GENERATED, TK);
  }

  // POST /google/connect — legacy returned { isConnected:false, redirectUrl }.
  async connectPost(req, res) {
    const { isConnected, authUrl } = await googleCalendarUsecase.connect({ authUser: req.auth });
    return ok(res, { isConnected, redirectUrl: authUrl }, calendarMessagesCodes.GOOGLE_AUTH_URL_GENERATED, TK);
  }

  // GET /google/callback — authenticated OAuth callback. The profile UI already consumes
  // googleAuthSuccess/googleAuthError query values, so failures redirect with stable codes.
  async handleOAuthCallback(req, res) {
    const { code, state } = req.query;
    if (typeof code !== "string" || !code || typeof state !== "string" || !state) {
      return res.redirect(
        `${process.env.DASHBOARD_ORIGIN}/dashboard?googleAuthError=${calendarMessagesCodes.GOOGLE_CALLBACK_INVALID}&profileOpen=true`,
      );
    }
    try {
      await googleCalendarUsecase.handleCallback({ code, state, authUser: req.auth });
      return res.redirect(
        `${process.env.DASHBOARD_ORIGIN}/dashboard?googleAuthSuccess=1&profileOpen=true`,
      );
    } catch (error) {
      const errorCode =
        error?.code === calendarMessagesCodes.GOOGLE_CALLBACK_INVALID
          ? calendarMessagesCodes.GOOGLE_CALLBACK_INVALID
          : calendarMessagesCodes.CALENDAR_FETCH_FAILED;
      return res.redirect(
        `${process.env.DASHBOARD_ORIGIN}/dashboard?googleAuthError=${errorCode}&profileOpen=true`,
      );
    }
  }

  // POST /google/disconnect.
  async disconnect(req, res) {
    await googleCalendarUsecase.disconnect({ authUser: req.auth });
    return deleted(res, calendarMessagesCodes.GOOGLE_DISCONNECTED, TK);
  }

  // GET /google/status.
  async getGoogleStatus(req, res) {
    const data = await googleCalendarUsecase.getGoogleStatus({ authUser: req.auth });
    return ok(res, data, calendarMessagesCodes.GOOGLE_STATUS_FETCHED, TK);
  }
}

export const googleCalendarController = new GoogleCalendarController();
export { GoogleCalendarController };
