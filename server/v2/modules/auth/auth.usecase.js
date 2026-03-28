import { HashService } from "../../infra/security/hash.js";
import { JwtService } from "../../infra/security/jwt.js";
import { AppError } from "../../shared/errors/AppError.js";
import { AuthRepository } from "./auth.repo.js";
import { AuthSchema } from "./auth.dto.js";

class AuthUseCase {
  static async login(email, password) {
    const user = await AuthRepository.findByEmail(email);

    if (!user) {
      throw new AppError("No user found with this email address", 401);
    }

    if (!user.password) {
      throw new AppError("You do not have a password, please reset it", 401);
    }

    const validPassword = await HashService.compare(password, user.password);
    if (!validPassword) {
      throw new AppError("Incorrect password", 401);
    }

    if (!user.isActive) {
      throw new AppError("Your account is blocked, you cannot log in", 403);
    }

    const accessToken = JwtService.signAccess(AuthSchema.toTokenPayload(user));
    const refreshToken = JwtService.signRefresh({ id: user.id });

    return { user: AuthSchema.toPublicUser(user), accessToken, refreshToken };
  }

  // ─── Request password reset ────────────────────────────────────────────────

  // ─── Reset password ────────────────────────────────────────────────────────
}

export { AuthUseCase };
