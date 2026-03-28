import { prisma } from "../../infra/prisma/prisma.js";
import { AuthSchema } from "./auth.schema.js";

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

  static updatePassword(id, hashedPassword) {
    return prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });
  }
}

export { AuthRepository };
