import { AuthUseCase } from "./auth.usecase.js";
import { AuthSchema } from "./auth.dto.js";
import { JwtService } from "../../infra/security/jwt.js";
import { ok } from "../../shared/http/response.js";
import { authMessagesCodes, messagesNames } from "@dms/shared";

class AuthController {
  static async login(req, res) {
    const { email, password } = req.body;

    const { user, accessToken, refreshToken } = await AuthUseCase.login(
      email,
      password,
    );

    // Issue ONLY the unified access/refresh pair. The legacy `"token"` cookie is
    // no longer issued (the middleware keeps a read-shim for already-issued ones).
    res
      .cookie(AuthSchema.cookieNames.ACCESS, accessToken, JwtService.cookies.access)
      .cookie(AuthSchema.cookieNames.REFRESH, refreshToken, JwtService.cookies.refresh);

    ok(res, { user }, authMessagesCodes.LOGIN_SUCCESS, messagesNames.authMessages);
  }

  static async logout(req, res) {
    // Clear the unified pair AND the legacy cookie (so legacy sessions log out too).
    res
      .cookie(AuthSchema.cookieNames.ACCESS, "", JwtService.cookies.clear)
      .cookie(AuthSchema.cookieNames.REFRESH, "", JwtService.cookies.clear)
      .cookie("token", "", JwtService.cookies.clear);
    ok(res, null, authMessagesCodes.LOGOUT_SUCCESS, messagesNames.authMessages);
  }

  static async refresh(req, res) {
    const { accessToken, refreshToken } = await AuthUseCase.refreshTokens(
      req.cookies[AuthSchema.cookieNames.REFRESH],
    );
    res
      .cookie(AuthSchema.cookieNames.ACCESS, accessToken, JwtService.cookies.access)
      .cookie(AuthSchema.cookieNames.REFRESH, refreshToken, JwtService.cookies.refresh);

    ok(res, {}, authMessagesCodes.TOKENS_REFRESHED, messagesNames.authMessages);
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
    const result = await AuthUseCase.resetPassword(token, password);
    ok(res, result, authMessagesCodes.PASSWORD_CHANGED, messagesNames.authMessages);
  }

  static async getCurrentUser(req, res) {
    // req.auth already carries the flattened effective permissions (attached by
    // requireAuth). toMe shapes the display fields + permissions + permissionsByModule.
    const user = AuthSchema.toMe(req.auth);
    ok(
      res,
      { user },
      authMessagesCodes.CURRENT_USER_RETRIEVED,
      messagesNames.authMessages,
    );
  }
}

export { AuthController };
