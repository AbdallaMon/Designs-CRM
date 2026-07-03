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
    // req.auth carries the cache-resolved effective permissions (from the active
    // profile). One DB read here supplies the user's assigned-profiles list (for
    // the switcher) — this is session-load, not the per-request hot path.
    const dbUser = await AuthUseCase.getMe(req.auth.id);
    const user = AuthSchema.toMe({
      ...dbUser,
      permissions: req.auth.permissions,
      permissionsByModule: req.auth.permissionsByModule,
    });
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
    });
    res
      .cookie(AuthSchema.cookieNames.ACCESS, accessToken, JwtService.cookies.access)
      .cookie(AuthSchema.cookieNames.REFRESH, refreshToken, JwtService.cookies.refresh);
    ok(res, { user }, authMessagesCodes.PROFILE_SWITCHED, messagesNames.authMessages);
  }
}

export { AuthController };
