import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the Prisma-only repo so we assert the row recordAction builds, without a DB.
vi.mock("../action-audit.repo.js", () => ({
  actionAuditRepository: { create: vi.fn().mockResolvedValue({ id: 1 }) },
}));

import { actionAuditRepository } from "../action-audit.repo.js";
import { recordAction, auditCtxFromReq } from "../record-action.js";

const ctx = { actorUserId: 7, actorProfileKey: "ADMIN", ip: "1.2.3.4" };

describe("recordAction", () => {
  beforeEach(() => vi.clearAllMocks());

  it("builds a row from ctx + event and calls repo.create", async () => {
    await recordAction(ctx, {
      module: "lead",
      action: "LEAD_CREATED",
      entityType: "ClientLead",
      entityId: 42,
      clientLeadId: 42,
      summary: "Lead #42 created",
    });
    expect(actionAuditRepository.create).toHaveBeenCalledTimes(1);
    expect(actionAuditRepository.create).toHaveBeenCalledWith({
      actorUserId: 7,
      actorRole: "ADMIN",
      ip: "1.2.3.4",
      module: "lead",
      action: "LEAD_CREATED",
      entityType: "ClientLead",
      entityId: 42,
      clientLeadId: 42,
      summary: "Lead #42 created",
      detail: null,
    });
  });

  it("computes the changed-only redacted diff into detail from before/after", async () => {
    await recordAction(ctx, {
      module: "user",
      action: "USER_UPDATED",
      entityType: "User",
      entityId: 9,
      before: { name: "a", role: "STAFF", password: "x" },
      after: { name: "b", role: "STAFF", password: "y" },
    });
    const row = actionAuditRepository.create.mock.calls[0][0];
    expect(row.detail.changed.sort()).toEqual(["name", "password"]);
    expect(row.detail.after.password).toBe("[redacted]");
    expect(row.detail.after.name).toBe("b");
    expect(row.detail.changed).not.toContain("role"); // unchanged omitted
  });

  it("honors allowedKeys to bound the diff scope", async () => {
    await recordAction(ctx, {
      module: "user",
      action: "USER_UPDATED",
      before: { name: "a", secret: "1" },
      after: { name: "b", secret: "2" },
      allowedKeys: ["name"],
    });
    const row = actionAuditRepository.create.mock.calls[0][0];
    expect(row.detail.changed).toEqual(["name"]);
  });

  it("prefers an explicit detail over the computed diff", async () => {
    await recordAction(ctx, {
      module: "lead",
      action: "LEAD_STATUS_CHANGED",
      before: { status: "NEW" },
      after: { status: "DONE" },
      detail: { custom: true },
    });
    const row = actionAuditRepository.create.mock.calls[0][0];
    expect(row.detail).toEqual({ custom: true });
  });

  it("redacts an explicit detail before persistence (no bypass of redaction)", async () => {
    await recordAction(ctx, {
      module: "auth",
      action: "PROFILE_SWITCH",
      detail: { token: "super-secret", note: "kept" },
    });
    const row = actionAuditRepository.create.mock.calls[0][0];
    expect(row.detail.token).toBe("[redacted]");
    expect(row.detail.note).toBe("kept"); // non-sensitive keys pass through
  });

  it("defaults missing ctx/event fields to null", async () => {
    await recordAction({}, { module: "auth", action: "PROFILE_SWITCH" });
    const row = actionAuditRepository.create.mock.calls[0][0];
    expect(row).toMatchObject({
      actorUserId: null,
      actorRole: null,
      ip: null,
      entityType: null,
      entityId: null,
      clientLeadId: null,
      summary: null,
      detail: null,
    });
  });

  it("NEVER throws when repo.create rejects (swallows + resolves)", async () => {
    actionAuditRepository.create.mockRejectedValueOnce(new Error("db down"));
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(
      recordAction(ctx, { module: "lead", action: "LEAD_CREATED" }),
    ).resolves.toBeUndefined();
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});

describe("auditCtxFromReq", () => {
  it("derives the actor from req.auth (never client input) + req.ip", () => {
    expect(auditCtxFromReq({ auth: { id: 3, currentProfileKey: "NORMAL_SALES" }, ip: "9.9.9.9" })).toEqual({
      actorUserId: 3,
      actorProfileKey: "NORMAL_SALES",
      ip: "9.9.9.9",
    });
  });

  it("is null-safe for a request without auth", () => {
    expect(auditCtxFromReq({})).toEqual({ actorUserId: null, actorProfileKey: null, ip: null });
    expect(auditCtxFromReq(undefined)).toEqual({ actorUserId: null, actorProfileKey: null, ip: null });
  });
});
