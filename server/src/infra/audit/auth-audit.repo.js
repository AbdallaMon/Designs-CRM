// Minimal authorization audit trail — the repo's first audit pattern. Writes an
// AuthAuditLog row for profile switch / assign / remove. Prisma lives only in
// repositories (layering rule). Callers pass a language-neutral `action` string.
//
// MIRROR: every AuthAuditLog write is ALSO mirrored into the unified ActionAuditLog
// trail via `recordAction` (module "auth") so the admin viewer sees the profile
// switch/assign/remove events alongside lead/contract/user actions. This is the single
// chokepoint for all three profile events. `recordAction` is non-blocking (never throws)
// and runs OUTSIDE any transaction, so the mirror can never break the auth op. The
// original `AuthAuditLog` write is unchanged.
import prisma from "@dms/db";
import { AUDIT_ACTIONS, AUDIT_MODULES } from "@dms/shared";
import { recordAction } from "./record-action.js";

export const AUTH_AUDIT_ACTIONS = {
  PROFILE_SWITCH: AUDIT_ACTIONS.PROFILE_SWITCH,
  PROFILE_ASSIGN: AUDIT_ACTIONS.PROFILE_ASSIGN,
  PROFILE_REMOVE: AUDIT_ACTIONS.PROFILE_REMOVE,
};

export const authAuditRepository = {
  async record({ actorUserId, targetUserId = null, action, detail = null }) {
    await prisma.authAuditLog.create({
      data: { actorUserId, targetUserId, action, detail },
    });
    // Mirror into the unified ActionAuditLog trail. The AUTH_AUDIT_ACTIONS values are
    // identical to the AUDIT_ACTIONS.PROFILE_* codes, so `action` passes through as-is.
    // No role/ip is available at this layer; the actor id is authoritative.
    await recordAction(
      { actorUserId, actorRole: null, ip: null },
      {
        module: AUDIT_MODULES.AUTH,
        action,
        entityType: "User",
        entityId: targetUserId,
        detail,
      },
    );
  },
};
