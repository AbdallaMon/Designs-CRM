// calendar/google controller — thin. The OAuth callback performs an HTTP REDIRECT (not an
// envelope response) exactly as legacy did, so it does not use the response helpers. The
// connect GET vs POST handlers preserve the legacy response key difference (authUrl vs
// redirectUrl). Tokens/secrets are NEVER logged or returned anywhere here.
import { ok, deleted } from "../../../shared/http/response.js";
import { calendarMessagesCodes, messagesNames } from "@dms/shared";
import { googleCalendarUsecase } from "./google.usecase.js";

const C = calendarMessagesCodes;
const TK = messagesNames.calendarMessages;

export class GoogleCalendarController {
  constructor(usecase) {
    this.usecase = usecase;
  }

  // GET /google/connect — legacy returned { isConnected:false, authUrl }.
  connectGet = async (req, res) => {
    const data = await this.usecase.connect({ authUser: req.auth });
    return ok(res, data, C.GOOGLE_AUTH_URL_GENERATED, TK);
  };

  // POST /google/connect — legacy returned { isConnected:false, redirectUrl }.
  connectPost = async (req, res) => {
    const { isConnected, authUrl } = await this.usecase.connect({ authUser: req.auth });
    return ok(res, { isConnected, redirectUrl: authUrl }, C.GOOGLE_AUTH_URL_GENERATED, TK);
  };

  // GET /google/callback — PUBLIC OAuth callback. Google redirects the browser here with
  // ?code&state. Behavior frozen: on success/failure redirect to the legacy dashboard URL.
  // We do NOT log code/state/tokens.
  callback = async (req, res) => {
    const { code, state } = req.query;
    if (!code || !state) {
      return res.status(400).send("Missing authorization code or state");
    }
    try {
      await this.usecase.handleCallback({ code, state });
      return res.redirect(
        `${process.env.OLDORIGIN}/dashboard?googleAuthSuccess=1&profileOpen=true`,
      );
    } catch (error) {
      return res.redirect(
        `${process.env.OLDORIGIN}/dashboard?googleAuthError=${encodeURIComponent(
          error.message,
        )}&profileOpen=true`,
      );
    }
  };

  // POST /google/disconnect.
  disconnect = async (req, res) => {
    await this.usecase.disconnect({ authUser: req.auth });
    return deleted(res, C.GOOGLE_DISCONNECTED, TK);
  };

  // GET /google/status.
  status = async (req, res) => {
    const data = await this.usecase.status({ authUser: req.auth });
    return ok(res, data, C.GOOGLE_STATUS_FETCHED, TK);
  };
}

export const googleCalendarController = new GoogleCalendarController(googleCalendarUsecase);
