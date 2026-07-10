import { describe, it, expect, vi } from "vitest";
import { AuditUsecase } from "../audit.usecase.js";
import { AuditValidation } from "../audit.validation.js";

function makeRepo(overrides = {}) {
  return {
    findManyPaged: vi.fn().mockResolvedValue({ items: [], total: 0 }),
    findUsersByIds: vi.fn().mockResolvedValue([]),
    ...overrides,
  };
}

describe("AuditUsecase.list — filter → where building", () => {
  it("builds a Prisma where from all provided filters", async () => {
    const repo = makeRepo();
    const usecase = new AuditUsecase(repo);
    const from = new Date("2026-01-01");
    const to = new Date("2026-02-01");
    await usecase.list({
      query: {
        page: 1,
        pageSize: 20,
        actorUserId: 7,
        module: "lead",
        action: "LEAD_CREATED",
        entityType: "ClientLead",
        entityId: 42,
        clientLeadId: 42,
        from,
        to,
      },
    });
    const arg = repo.findManyPaged.mock.calls[0][0];
    expect(arg.where).toEqual({
      actorUserId: 7,
      module: "lead",
      action: "LEAD_CREATED",
      entityType: "ClientLead",
      entityId: 42,
      clientLeadId: 42,
      createdAt: { gte: from, lte: to },
    });
  });

  it("omits absent filters (empty where) and computes skip from page/pageSize", async () => {
    const repo = makeRepo();
    const usecase = new AuditUsecase(repo);
    await usecase.list({ query: { page: 3, pageSize: 10 } });
    const arg = repo.findManyPaged.mock.calls[0][0];
    expect(arg.where).toEqual({});
    expect(arg.skip).toBe(20); // (3-1)*10
    expect(arg.take).toBe(10);
  });

  it("supports a one-sided date range (from only)", async () => {
    const repo = makeRepo();
    const usecase = new AuditUsecase(repo);
    const from = new Date("2026-05-01");
    await usecase.list({ query: { page: 1, pageSize: 20, from } });
    expect(repo.findManyPaged.mock.calls[0][0].where).toEqual({ createdAt: { gte: from } });
  });
});

describe("AuditUsecase.list — actor resolution + dto mapping", () => {
  it("resolves actor names via ONE batched lookup for distinct ids and shapes rows", async () => {
    const items = [
      { id: 2, createdAt: new Date("2026-01-02"), actorUserId: 7, actorRole: "ADMIN", module: "lead", action: "LEAD_CREATED", entityType: "ClientLead", entityId: 42, clientLeadId: 42, summary: "Lead #42 created", detail: { changed: ["x"] } },
      { id: 1, createdAt: new Date("2026-01-01"), actorUserId: 7, actorRole: "ADMIN", module: "user", action: "USER_UPDATED", entityType: "User", entityId: 9, clientLeadId: null, summary: null, detail: null },
    ];
    const repo = makeRepo({
      findManyPaged: vi.fn().mockResolvedValue({ items, total: 2 }),
      findUsersByIds: vi.fn().mockResolvedValue([{ id: 7, name: "Boss", role: "SUPER_ADMIN" }]),
    });
    const usecase = new AuditUsecase(repo);
    const result = await usecase.list({ query: { page: 1, pageSize: 20 } });

    // distinct ids only (7 appears twice → looked up once)
    expect(repo.findUsersByIds).toHaveBeenCalledWith([7]);
    expect(result).toEqual({
      total: 2,
      page: 1,
      pageSize: 20,
      items: [
        {
          id: 2,
          createdAt: items[0].createdAt,
          actor: { id: 7, name: "Boss", role: "ADMIN" }, // role = snapshot at action time
          module: "lead",
          action: "LEAD_CREATED",
          entityType: "ClientLead",
          entityId: 42,
          clientLeadId: 42,
          summary: "Lead #42 created",
          detail: { changed: ["x"] },
        },
        {
          id: 1,
          createdAt: items[1].createdAt,
          actor: { id: 7, name: "Boss", role: "ADMIN" },
          module: "user",
          action: "USER_UPDATED",
          entityType: "User",
          entityId: 9,
          clientLeadId: null,
          summary: null,
          detail: null,
        },
      ],
    });
  });

  it("tolerates an unresolved actor (name null, role falls back to snapshot)", async () => {
    const items = [
      { id: 1, createdAt: new Date(), actorUserId: 99, actorRole: "STAFF", module: "lead", action: "LEAD_CALL_LOGGED", entityType: null, entityId: null, clientLeadId: 5, summary: null, detail: null },
    ];
    const repo = makeRepo({ findManyPaged: vi.fn().mockResolvedValue({ items, total: 1 }) });
    const usecase = new AuditUsecase(repo);
    const result = await usecase.list({ query: { page: 1, pageSize: 20 } });
    expect(result.items[0].actor).toEqual({ id: 99, name: null, role: "STAFF" });
  });
});

describe("AuditValidation.listQuery", () => {
  it("defaults page=1, pageSize=20 and coerces string numbers", () => {
    const r = AuditValidation.listQuery.safeParse({});
    expect(r.success).toBe(true);
    expect(r.data.page).toBe(1);
    expect(r.data.pageSize).toBe(20);

    const r2 = AuditValidation.listQuery.safeParse({ page: "3", pageSize: "50" });
    expect(r2.data.page).toBe(3);
    expect(r2.data.pageSize).toBe(50);
  });

  it("rejects an over-max pageSize and a non-positive page", () => {
    expect(AuditValidation.listQuery.safeParse({ pageSize: "1000" }).success).toBe(false);
    expect(AuditValidation.listQuery.safeParse({ page: "0" }).success).toBe(false);
  });

  it("coerces optional id + date filters and ignores unknown params", () => {
    const r = AuditValidation.listQuery.safeParse({
      actorUserId: "7",
      entityId: "42",
      clientLeadId: "42",
      module: "lead",
      from: "2026-01-01",
      to: "2026-02-01",
      somethingUnknown: "x",
    });
    expect(r.success).toBe(true);
    expect(r.data.actorUserId).toBe(7);
    expect(r.data.entityId).toBe(42);
    expect(r.data.from instanceof Date).toBe(true);
    expect(r.data.module).toBe("lead");
  });

  it("rejects a non-positive actorUserId", () => {
    expect(AuditValidation.listQuery.safeParse({ actorUserId: "0" }).success).toBe(false);
  });
});
