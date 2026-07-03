import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@dms/db", () => ({ default: { authAuditLog: { create: vi.fn() } } }));

import prisma from "@dms/db";
import { authAuditRepository } from "../auth-audit.repository.js";

describe("authAuditRepository.record", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates an AuthAuditLog row with the given shape", async () => {
    await authAuditRepository.record({
      actorUserId: 1,
      targetUserId: 2,
      action: "PROFILE_SWITCH",
      detail: { profileId: 5 },
    });
    expect(prisma.authAuditLog.create).toHaveBeenCalledWith({
      data: { actorUserId: 1, targetUserId: 2, action: "PROFILE_SWITCH", detail: { profileId: 5 } },
    });
  });

  it("defaults targetUserId and detail to null", async () => {
    await authAuditRepository.record({ actorUserId: 1, action: "PROFILE_ASSIGN" });
    expect(prisma.authAuditLog.create).toHaveBeenCalledWith({
      data: { actorUserId: 1, targetUserId: null, action: "PROFILE_ASSIGN", detail: null },
    });
  });
});
