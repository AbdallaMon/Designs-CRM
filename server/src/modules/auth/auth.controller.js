import { AuthUseCase } from "./auth.usecase.js";
import { AuthSchema } from "./auth.dto.js";
import { JwtService } from "../../infra/security/jwt.js";
import { CsrfService } from "../../infra/security/csrf.js";
import { ok } from "../../shared/http/response.js";
import { authMessagesCodes, messagesNames } from "@dms/shared";

function setSessionCookies(req, res, accessToken, refreshToken) {
  res
    .cookie(AuthSchema.cookieNames.ACCESS, accessToken, JwtService.cookies.access)
    .cookie(AuthSchema.cookieNames.REFRESH, refreshToken, JwtService.cookies.refresh);
  CsrfService.issue(req, res);
}

class AuthController {
  static async login(req, res) {
    const { email, password } = req.body;

    const { user, accessToken, refreshToken } = await AuthUseCase.login(
      email,
      password,
    );

    setSessionCookies(req, res, accessToken, refreshToken);

    ok(res, { user }, authMessagesCodes.LOGIN_SUCCESS, messagesNames.authMessages);
  }

  static async logout(req, res) {
    await AuthUseCase.logout(req.cookies[AuthSchema.cookieNames.REFRESH]);
    res
      .cookie(AuthSchema.cookieNames.ACCESS, "", JwtService.cookies.clear)
      .cookie(AuthSchema.cookieNames.REFRESH, "", JwtService.cookies.clear);
    CsrfService.clear(res);
    ok(res, null, authMessagesCodes.LOGOUT_SUCCESS, messagesNames.authMessages);
  }

  static async refresh(req, res) {
    const { accessToken, refreshToken } = await AuthUseCase.refreshTokens(
      req.cookies[AuthSchema.cookieNames.REFRESH],
    );
    setSessionCookies(req, res, accessToken, refreshToken);

    ok(res, {}, authMessagesCodes.TOKENS_REFRESHED, messagesNames.authMessages);
  }

  static async csrfToken(req, res) {
    const csrfToken = CsrfService.issue(req, res);
    ok(res, { csrfToken });
  }

  static async requestPasswordReset(req, res) {
    const { email } = req.body;
    const result = await AuthUseCase.requestPasswordReset(email);
    ok(
      res,
      result ?? null,
      authMessagesCodes.PASSWORD_RESET_REQUESTED,
      messagesNames.authMessages,
    );
  }

  static async resetPassword(req, res) {
    const { token, password } = req.body;
    await AuthUseCase.resetPassword(token, password);
    ok(res, null, authMessagesCodes.PASSWORD_CHANGED, messagesNames.authMessages);
  }

  static async getCurrentUser(req, res) {
    // req.auth already carries the cache-resolved effective permissions AND the
    // assigned-profiles list (both from the token + profile cache) — so /auth/me is
    // DB-free, exactly like before. toMe shapes the display fields + permissions.
    const user = AuthSchema.toMe(req.auth);
    ok(
      res,
      { user },
      authMessagesCodes.CURRENT_USER_RETRIEVED,
      messagesNames.authMessages,
    );
  }

  static async switchProfile(req, res) {
    const { user, accessToken, refreshToken } = await AuthUseCase.switchProfile({
      authUser: req.auth,
      profileId: req.body.profileId,
      refreshToken: req.cookies[AuthSchema.cookieNames.REFRESH],
    });
    setSessionCookies(req, res, accessToken, refreshToken);
    ok(res, { user }, authMessagesCodes.PROFILE_SWITCHED, messagesNames.authMessages);
  }
}

export { AuthController };
