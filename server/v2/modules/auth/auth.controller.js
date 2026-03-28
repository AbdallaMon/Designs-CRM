import { AuthUseCase } from "./auth.usecase.js";
import { AuthSchema } from "./auth.schema.js";
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
      .cookie(AuthSchema.cookieNames.ACCESS, accessToken, JwtService.cookies.access)
      .cookie(AuthSchema.cookieNames.REFRESH, refreshToken, JwtService.cookies.refresh);

    ok(res, { user }, "Login successful");
  }
}

export { AuthController };
