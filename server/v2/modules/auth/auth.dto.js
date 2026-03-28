class AuthSchema {
  // ─── Prisma select shapes ───────────────────────────────────────────────────
  // Used in auth.repo.js — keeps query projections consistent and centralized.

  /** Fields needed for login + active status checks. Includes password for bcrypt. */
  static userAuthSelect = {
    id: true,
    email: true,
    name: true,
    password: true,
    role: true,
    isActive: true,
    isPrimary: true,
    isSuperSales: true,
    profilePicture: true,
  };

  /** Minimal fields for refresh-token rotation — no password needed. */
  static userRefreshSelect = {
    id: true,
    email: true,
    name: true,
    role: true,
    isActive: true,
    isPrimary: true,
    isSuperSales: true,
    profilePicture: true,
  };

  // ─── Cookie names ──────────────────────────────────────────────────────────

  static cookieNames = {
    ACCESS: "access_token",
    REFRESH: "refresh_token",
  };

  // ─── Response DTOs ─────────────────────────────────────────────────────────

  /**
   * Strips password before sending user data to the client.
   * Always call this before putting a user object in a response.
   * @param {object} user  Raw user from Prisma
   * @returns {object}     Safe public representation
   */
  static toPublicUser(user) {
    const { password, ...safe } = user;
    return safe;
  }

  // ─── JWT payload shape ─────────────────────────────────────────────────────

  /**
   * Builds the minimal payload embedded in every token.
   * @param {object} user  Prisma user row
   * @returns {object}     JWT payload
   */
  static toTokenPayload(user) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
      isPrimary: user.isPrimary,
      isSuperSales: user.isSuperSales,
    };
  }
}

export { AuthSchema };
