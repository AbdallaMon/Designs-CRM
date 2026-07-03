import { prisma } from "../../infra/prisma/prisma.js";
import { AuthSchema } from "./auth.dto.js";

class AuthRepository {
  static findByEmail(email) {
    return prisma.user.findUnique({
      where: { email },
      select: AuthSchema.userAuthSelect,
    });
  }

  static findById(id) {
    return prisma.user.findUnique({
      where: { id },
      select: AuthSchema.userAuthSelect,
    });
  }
  static changePassword(password, userId) {
    return prisma.user.update({
      where: {
        id: Number(userId),
      },
      data: {
        password,
      },
    });
  }

  /** Set the user's active profile (used by refresh re-validation + profile switch). */
  static setCurrentProfile(id, profileId) {
    return prisma.user.update({
      where: { id: Number(id) },
      data: { currentProfileId: profileId == null ? null : Number(profileId) },
    });
  }
}

export { AuthRepository };
