// Minimal authorization audit trail — the repo's first audit pattern. Writes an
// AuthAuditLog row for profile switch / assign / remove. Prisma lives only in
// repositories (layering rule). Callers pass a language-neutral `action` string.
import prisma from "@dms/db";

export const AUTH_AUDIT_ACTIONS = {
  PROFILE_SWITCH: "PROFILE_SWITCH",
  PROFILE_ASSIGN: "PROFILE_ASSIGN",
  PROFILE_REMOVE: "PROFILE_REMOVE",
};

export const authAuditRepository = {
  async record({ actorUserId, targetUserId = null, action, detail = null }) {
    await prisma.authAuditLog.create({
      data: { actorUserId, targetUserId, action, detail },
    });
  },
};
