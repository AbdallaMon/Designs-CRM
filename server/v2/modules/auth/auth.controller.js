import { AuthUseCase } from "./auth.usecase.js";
import { AuthSchema } from "./auth.dto.js";
import { JwtService } from "../../infra/security/jwt.js";
import { ok } from "../../shared/http/response.js";

class AuthController {
  static async login(req, res) {
    const { email, password } = req.body;

    const { user, accessToken, refreshToken } = await AuthUseCase.login(
      email,
      password,
    );

    res
      .cookie(
        AuthSchema.cookieNames.ACCESS,
        accessToken,
        JwtService.cookies.access,
      )
      .cookie(
        AuthSchema.cookieNames.REFRESH,
        refreshToken,
        JwtService.cookies.refresh,
      )
      // TODO: remove once all routes are migrated to v2
      .cookie("token", accessToken, JwtService.cookies.access);

    ok(res, { user }, "Login successful");
  }
  static async logout(req, res) {
    res
      .cookie(AuthSchema.cookieNames.ACCESS, "", JwtService.cookies.clear)
      .cookie(AuthSchema.cookieNames.REFRESH, "", JwtService.cookies.clear)
      // TODO: remove once all routes are migrated to v2
      .cookie("token", "", JwtService.cookies.clear);
    ok(res, null, "Logout successful");
  }
  static async refresh(req, res) {
    console.log("refresging");
    const { accessToken, refreshToken } = await AuthUseCase.refreshTokens(
      req.cookies[AuthSchema.cookieNames.REFRESH],
    );
    res
      .cookie(
        AuthSchema.cookieNames.ACCESS,
        accessToken,
        JwtService.cookies.access,
      )
      .cookie(
        AuthSchema.cookieNames.REFRESH,
        refreshToken,
        JwtService.cookies.refresh,
      )
      // TODO: remove once all routes are migrated to v2
      .cookie("token", accessToken, JwtService.cookies.access);

    ok(res, {}, "Tokens updated");
  }
  static async requestPasswordReset(req, res) {
    const { email } = req.body;
    const result = await AuthUseCase.requestPasswordReset(email);
    ok(
      res,
      result,
      "If an account with that email exists, a password reset link has been sent",
    );
  }
  static async resetPassword(req, res) {
    const { token, password } = req.body;
    console.log(req.body, " req.body");
    const result = await AuthUseCase.resetPassword(token, password);
    ok(res, result, "Password changed succussfuly");
  }
  static async getCurrentUser(req, res) {
    const user = req.auth;
    ok(res, { user }, "Current user retrieved successfully");
  }
}

export { AuthController };
