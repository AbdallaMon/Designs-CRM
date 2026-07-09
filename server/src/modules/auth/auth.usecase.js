import { HashService } from "../../infra/security/hash.js";
import { JwtService } from "../../infra/security/jwt.js";
import { AppError } from "../../shared/errors/AppError.js";
import { AuthRepository } from "./auth.repo.js";
import { AuthSchema } from "./auth.dto.js";
import { sendEmail } from "../../infra/mail/mail.js";
import { AuthEmails } from "./auth.emails.js";
import { profileCache } from "../../infra/auth/profile-cache.js";
import { authAuditRepository, AUTH_AUDIT_ACTIONS } from "../../infra/audit/auth-audit.repo.js";
import { authMessagesCodes } from "@dms/shared";

/**
 * Pick the token's currentProfileId: the stored one if the user still holds it,
 * else the first assigned profile (the backfill/switch keeps this sensible; this
 * only corrects a stale/dangling current, e.g. after an admin removed a profile).
 */
export function resolveValidCurrentProfileId(user) {
  const held = (user?.userProfiles ?? []).map((up) => up.profile?.id).filter((x) => x != null);
  if (user?.currentProfileId && held.includes(user.currentProfileId)) return user.currentProfileId;
  return held[0] ?? null;
}

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

    // Ensure the token carries a HELD current profile; persist a correction if the
    // stored one is stale/null.
    const currentProfileId = resolveValidCurrentProfileId(user);
    if (currentProfileId && currentProfileId !== user.currentProfileId) {
      await AuthRepository.setCurrentProfile(user.id, currentProfileId);
    }
    const withCurrent = { ...user, currentProfileId };

    const accessToken = JwtService.signAccess(AuthSchema.toTokenPayload(withCurrent));
    const refreshToken = JwtService.signRefresh({ id: user.id });

    return { user: AuthSchema.toPublicUser(withCurrent), accessToken, refreshToken };
  }
  static async refreshTokens(token) {
    if (!token) throw new AppError(authMessagesCodes.REFRESH_TOKEN_MISSING, 401);

    const decoded = JwtService.verifyRefresh(token);
    const user = await AuthRepository.findById(decoded.id);

    if (!user || !user.isActive)
      throw new AppError(authMessagesCodes.UNAUTHORIZED, 401);

    // Re-validate the current profile on every refresh (this is where an admin's
    // profile change propagates into a fresh access token).
    const currentProfileId = resolveValidCurrentProfileId(user);
    if (currentProfileId && currentProfileId !== user.currentProfileId) {
      await AuthRepository.setCurrentProfile(user.id, currentProfileId);
    }

    const accessToken = JwtService.signAccess(
      AuthSchema.toTokenPayload({ ...user, currentProfileId }),
    );
    const refreshToken = JwtService.signRefresh({ id: user.id });

    return { accessToken, refreshToken };
  }

  /**
   * Self-service profile switch. The caller may only switch to a profile they
   * actually hold. Persists the new current, audits it, and re-mints the token
   * pair so the new profile's permissions take effect immediately.
   */
  static async switchProfile({ authUser, profileId }) {
    const user = await AuthRepository.findById(authUser.id);
    if (!user || !user.isActive) throw new AppError(authMessagesCodes.UNAUTHORIZED, 401);

    const targetId = Number(profileId);
    const held = (user.userProfiles ?? []).map((up) => up.profile.id);
    if (!held.includes(targetId)) {
      throw new AppError(authMessagesCodes.PROFILE_NOT_ASSIGNED, 403);
    }
    const resolved = profileCache.resolve(targetId);
    if (!resolved) throw new AppError(authMessagesCodes.PROFILE_NOT_FOUND, 404);

    await AuthRepository.setCurrentProfile(user.id, targetId);
    await authAuditRepository.record({
      actorUserId: user.id,
      targetUserId: user.id,
      action: AUTH_AUDIT_ACTIONS.PROFILE_SWITCH,
      detail: { from: user.currentProfileId ?? null, to: targetId },
    });

    // Build the fresh view from the cache resolution (no second DB read).
    const freshUser = {
      ...user,
      currentProfileId: targetId,
      currentProfile: {
        id: targetId,
        key: resolved.key,
        baseRole: resolved.baseRole,
        isAdminTier: resolved.isAdminTier,
      },
      permissions: resolved.permissions,
      permissionsByModule: resolved.permissionsByModule,
    };
    const accessToken = JwtService.signAccess(AuthSchema.toTokenPayload(freshUser));
    const refreshToken = JwtService.signRefresh({ id: user.id });

    return { user: AuthSchema.toMe(freshUser), accessToken, refreshToken };
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
