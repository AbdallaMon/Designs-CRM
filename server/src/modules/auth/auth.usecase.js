import { HashService } from "../../infra/security/hash.js";
import { JwtService } from "../../infra/security/jwt.js";
import { AppError } from "../../shared/errors/AppError.js";
import { AuthRepository } from "./auth.repository.js";
import { AuthSchema } from "./auth.dto.js";
import { sendEmail } from "../../infra/mail/mail.js";
import { AuthEmails } from "./auth.emails.js";
import { authMessagesCodes } from "@dms/shared";

class AuthUseCase {
  static async login(email, password) {
    const user = await AuthRepository.findByEmail(email);

    const DUMMY_HASH =
      "$2b$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012345";
    const validPassword = await HashService.compare(
      password,
      user?.password ?? DUMMY_HASH,
    );

    if (!user || !user.password || !validPassword) {
      throw new AppError(authMessagesCodes.INVALID_CREDENTIALS, 401);
    }

    if (!user.isActive) {
      throw new AppError(authMessagesCodes.ACCOUNT_BLOCKED, 403);
    }

    const accessToken = JwtService.signAccess(AuthSchema.toTokenPayload(user));
    const refreshToken = JwtService.signRefresh({ id: user.id });

    return { user: AuthSchema.toPublicUser(user), accessToken, refreshToken };
  }
  static async refreshTokens(token) {
    if (!token) throw new AppError(authMessagesCodes.REFRESH_TOKEN_MISSING, 401);

    const decoded = JwtService.verifyRefresh(token);
    const user = await AuthRepository.findById(decoded.id);

    if (!user || !user.isActive)
      throw new AppError(authMessagesCodes.UNAUTHORIZED, 401);

    const accessToken = JwtService.signAccess(AuthSchema.toTokenPayload(user));
    const refreshToken = JwtService.signRefresh({ id: user.id });

    return { accessToken, refreshToken };
  }
  static async requestPasswordReset(email) {
    const user = await AuthRepository.findByEmail(email);
    if (!user || !user.isActive) return; // silent — don't leak email existence

    const resetToken = JwtService.signReset({ id: user.id });
    const resetEmail = AuthEmails.resetEmail(resetToken);
    await sendEmail({
      to: user.email,
      subject: resetEmail.subject,
      html: resetEmail.html,
    });
    return;
  }
  static async resetPassword(token, newPassword) {
    if (!token) throw new AppError(authMessagesCodes.RESET_TOKEN_MISSING, 400);
    const decoded = JwtService.verifyReset(token);
    const user = await AuthRepository.findById(decoded.id);
    if (!user || !user.isActive)
      throw new AppError(authMessagesCodes.UNAUTHORIZED, 401);

    const isSamePassword = await HashService.compare(
      newPassword,
      user.password,
    );
    if (isSamePassword)
      throw new AppError(authMessagesCodes.PASSWORD_MUST_DIFFER, 400);

    const hashedPassword = await HashService.hash(newPassword);
    return await AuthRepository.changePassword(hashedPassword, user.id);
  }
}

export { AuthUseCase };
