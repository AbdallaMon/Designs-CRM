import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the singleton Prisma client (same seam as auth-audit.repository.test.js).
vi.mock("@dms/db", () => ({
  default: {
    actionAuditLog: { create: vi.fn(), findMany: vi.fn(), count: vi.fn() },
    user: { findMany: vi.fn() },
    $transaction: vi.fn(),
  },
}));

import prisma from "@dms/db";
import { actionAuditRepository } from "../action-audit.repo.js";

describe("actionAuditRepository", () => {
  beforeEach(() => vi.clearAllMocks());

  it("create() appends a row with the given data", async () => {
    prisma.actionAuditLog.create.mockResolvedValue({ id: 5 });
    const row = { actorUserId: 1, module: "lead", action: "LEAD_CREATED" };
    const res = await actionAuditRepository.create(row);
    expect(prisma.actionAuditLog.create).toHaveBeenCalledWith({ data: row });
    expect(res).toEqual({ id: 5 });
  });

  it("findManyPaged() runs findMany(desc) + count in one transaction, returns {items,total}", async () => {
    prisma.$transaction.mockResolvedValue([[{ id: 2 }, { id: 1 }], 2]);
    const where = { module: "lead" };
    const res = await actionAuditRepository.findManyPaged({ where, skip: 0, take: 20 });

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    // findMany called with newest-first ordering + the paging window.
    expect(prisma.actionAuditLog.findMany).toHaveBeenCalledWith({
      where,
      skip: 0,
      take: 20,
      orderBy: { createdAt: "desc" },
    });
    expect(prisma.actionAuditLog.count).toHaveBeenCalledWith({ where });
    expect(res).toEqual({ items: [{ id: 2 }, { id: 1 }], total: 2 });
  });

  it("findUsersByIds() selects a SAFE actor projection (no secrets); [] short-circuits", async () => {
    expect(await actionAuditRepository.findUsersByIds([])).toEqual([]);
    expect(prisma.user.findMany).not.toHaveBeenCalled();

    prisma.user.findMany.mockResolvedValue([{ id: 1, name: "A", role: "ADMIN" }]);
    await actionAuditRepository.findUsersByIds([1, 2]);
    expect(prisma.user.findMany).toHaveBeenCalledWith({
      where: { id: { in: [1, 2] } },
      select: { id: true, name: true, role: true },
    });
  });
});
