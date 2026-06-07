import { describe, it, expect, vi } from "vitest";

import { AuthMiddleware } from "../../../shared/middlewares/auth.middleware.js";
import { AppError } from "../../../shared/errors/AppError.js";
import {
  PERMISSIONS,
  getEffectivePermissions,
  USER_ROLES,
  authMessagesCodes,
  adminResidualMessagesCodes,
} from "@dms/shared";

import { ModelArchiveUsecase } from "../model-archive/model-archive.usecase.js";
import { CommissionsValidation } from "../commissions/commissions.validation.js";
import { ModelArchiveValidation } from "../model-archive/model-archive.validation.js";
import { FixedDataValidation } from "../fixed-data/fixed-data.validation.js";
import { ReportsValidation } from "../reports/reports.validation.js";
import { AdminLeadsUsecase } from "../admin-leads/admin-leads.usecase.js";
import { adminLeadsRepository } from "../admin-leads/admin-leads.repository.js";
import { StaffUsecase } from "../staff/staff.usecase.js";

const C = adminResidualMessagesCodes;
const PA = PERMISSIONS.ADMIN_RESIDUAL;
const PS = PERMISSIONS.STAFF;

function makeReq(role, { isSuperSales = false, subRoles = [] } = {}) {
  const { permissions, permissionsByModule } = getEffectivePermissions({ role, isSuperSales, subRoles });
  return { auth: { id: 1, role, isSuperSales, permissions, permissionsByModule } };
}

// ════════════════════════════════════════════════════════════════════════════
//  ROUTE PERMISSION GATE — ADMIN-tier residual (allow vs deny)
// ════════════════════════════════════════════════════════════════════════════
describe("admin-residual route permission gate (allow vs deny)", () => {
  it("ADMIN passes the report-generate gate", () => {
    const next = vi.fn();
    AuthMiddleware.requirePermissions([PA.REPORT_GENERATE])(makeReq(USER_ROLES.ADMIN), {}, next);
    expect(next).toHaveBeenCalledWith();
  });

  it("SUPER_ADMIN passes the commission-manage gate", () => {
    const next = vi.fn();
    AuthMiddleware.requirePermissions([PA.COMMISSION_MANAGE])(makeReq(USER_ROLES.SUPER_ADMIN), {}, next);
    expect(next).toHaveBeenCalledWith();
  });

  it("isSuperSales passes the model-archive gate (legacy isAdmin union)", () => {
    const next = vi.fn();
    AuthMiddleware.requirePermissions([PA.MODEL_ARCHIVE])(makeReq(USER_ROLES.SUPER_SALES, { isSuperSales: true }), {}, next);
    expect(next).toHaveBeenCalledWith();
  });

  it("an ADMIN/SUPER_ADMIN sub-role passes the lead-delete gate (isAdmin union)", () => {
    const next = vi.fn();
    AuthMiddleware.requirePermissions([PA.LEAD_DELETE])(
      makeReq(USER_ROLES.STAFF, { subRoles: [{ subRole: USER_ROLES.ADMIN }] }),
      {},
      next,
    );
    expect(next).toHaveBeenCalledWith();
  });

  it("plain STAFF is 403'd on the report-generate gate", () => {
    const next = vi.fn();
    AuthMiddleware.requirePermissions([PA.REPORT_GENERATE])(makeReq(USER_ROLES.STAFF), {}, next);
    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(403);
    expect(err.message).toBe(authMessagesCodes.FORBIDDEN);
  });

  it("a sales/contact-initiator is 403'd on the fixed-data + commissions gates", () => {
    for (const code of [PA.FIXED_DATA_MANAGE, PA.COMMISSION_MANAGE, PA.LEAD_CREATE]) {
      const next = vi.fn();
      AuthMiddleware.requirePermissions([code])(makeReq(USER_ROLES.CONTACT_INITIATOR), {}, next);
      expect(next.mock.calls[0][0].statusCode).toBe(403);
    }
  });

  it("an ACCOUNTANT is 403'd on the admin-residual surface (not in the isAdmin union)", () => {
    const next = vi.fn();
    AuthMiddleware.requirePermissions([PA.PROJECT_VIEW])(makeReq(USER_ROLES.ACCOUNTANT), {}, next);
    expect(next.mock.calls[0][0].statusCode).toBe(403);
  });
});

// ════════════════════════════════════════════════════════════════════════════
//  STAFF latest-calls gate (a DIFFERENT role set)
// ════════════════════════════════════════════════════════════════════════════
describe("staff latest-calls route gate", () => {
  it("a STAFF / designer / accountant / executor passes the latest-calls gate", () => {
    for (const role of [
      USER_ROLES.STAFF,
      USER_ROLES.THREE_D_DESIGNER,
      USER_ROLES.TWO_D_DESIGNER,
      USER_ROLES.ACCOUNTANT,
      USER_ROLES.TWO_D_EXECUTOR,
    ]) {
      const next = vi.fn();
      AuthMiddleware.requirePermissions([PS.LATEST_CALLS_VIEW])(makeReq(role), {}, next);
      expect(next).toHaveBeenCalledWith();
    }
  });

  it("an ADMIN / SUPER_ADMIN / SUPER_SALES / CONTACT_INITIATOR is 403'd on the latest-calls gate", () => {
    for (const role of [
      USER_ROLES.ADMIN,
      USER_ROLES.SUPER_ADMIN,
      USER_ROLES.SUPER_SALES,
      USER_ROLES.CONTACT_INITIATOR,
    ]) {
      const next = vi.fn();
      AuthMiddleware.requirePermissions([PS.LATEST_CALLS_VIEW])(makeReq(role), {}, next);
      expect(next.mock.calls[0][0].statusCode).toBe(403);
    }
  });
});

// ════════════════════════════════════════════════════════════════════════════
//  MODEL-ARCHIVE — allow-list resolution + reject
// ════════════════════════════════════════════════════════════════════════════
describe("model-archive allow-list", () => {
  it("resolves the FE-cased model names to real Prisma delegates and archives", async () => {
    const toggle = vi.fn().mockResolvedValue({ id: 7, isArchived: true });
    const usecase = new ModelArchiveUsecase({ toggleArchiveAModel: toggle });

    // FE sends "ColorPattern" (capital C) — must resolve to the camelCase delegate.
    await usecase.archive({ model: "ColorPattern", id: "7", isArchived: true });
    expect(toggle).toHaveBeenCalledWith({ model: "colorPattern", id: 7, isArchived: true });

    await usecase.archive({ model: "designImage", id: 3, isArchived: false });
    expect(toggle).toHaveBeenCalledWith({ model: "designImage", id: 3, isArchived: false });
  });

  it("REJECTS a non-whitelisted model with a 422 language-neutral code (never touches Prisma)", async () => {
    const toggle = vi.fn();
    const usecase = new ModelArchiveUsecase({ toggleArchiveAModel: toggle });

    // the allow-list check is synchronous → archive() throws before any await.
    let err;
    try {
      usecase.archive({ model: "user", id: 1, isArchived: true });
    } catch (e) {
      err = e;
    }
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(422);
    expect(err.message).toBe(C.MODEL_NOT_ALLOWED);

    expect(() => usecase.archive({ model: "clientLead", id: 1, isArchived: true })).toThrow(AppError);
    expect(toggle).not.toHaveBeenCalled();
  });

  it("the validation query also rejects non-whitelisted models (422 at the route)", () => {
    expect(ModelArchiveValidation.query.safeParse({ model: "style" }).success).toBe(true);
    expect(ModelArchiveValidation.query.safeParse({ model: "ColorPattern" }).success).toBe(true);
    expect(ModelArchiveValidation.query.safeParse({ model: "user" }).success).toBe(false);
    expect(ModelArchiveValidation.query.safeParse({ model: "" }).success).toBe(false);
  });

  it("the body requires a boolean isArchived and rejects extra keys (.strict)", () => {
    expect(ModelArchiveValidation.body.safeParse({ isArchived: true }).success).toBe(true);
    expect(ModelArchiveValidation.body.safeParse({ isArchived: "yes" }).success).toBe(false);
    expect(ModelArchiveValidation.body.safeParse({ isArchived: true, model: "x" }).success).toBe(false);
  });
});

// ════════════════════════════════════════════════════════════════════════════
//  COMMISSIONS — money validation
// ════════════════════════════════════════════════════════════════════════════
describe("commissions money validation", () => {
  it("accepts a finite positive amount + a non-empty reason", () => {
    const r = CommissionsValidation.createBody.safeParse({
      userId: 1,
      leadId: 2,
      amount: 150.5,
      commissionReason: "bonus",
    });
    expect(r.success).toBe(true);
  });

  it("rejects amount <= 0, NaN/Infinity, and a missing reason", () => {
    expect(CommissionsValidation.createBody.safeParse({ userId: 1, leadId: 2, amount: 0, commissionReason: "x" }).success).toBe(false);
    expect(CommissionsValidation.createBody.safeParse({ userId: 1, leadId: 2, amount: -5, commissionReason: "x" }).success).toBe(false);
    expect(CommissionsValidation.createBody.safeParse({ userId: 1, leadId: 2, amount: Infinity, commissionReason: "x" }).success).toBe(false);
    expect(CommissionsValidation.createBody.safeParse({ userId: 1, leadId: 2, amount: 10, commissionReason: "" }).success).toBe(false);
  });

  it("rejects extra body keys (.strict mass-assignment hardening)", () => {
    const r = CommissionsValidation.createBody.safeParse({
      userId: 1,
      leadId: 2,
      amount: 10,
      commissionReason: "x",
      isCleared: true,
    });
    expect(r.success).toBe(false);
  });

  it("update accepts a positive amount only", () => {
    expect(CommissionsValidation.updateBody.safeParse({ amount: 25 }).success).toBe(true);
    expect(CommissionsValidation.updateBody.safeParse({ amount: -1 }).success).toBe(false);
    expect(CommissionsValidation.updateBody.safeParse({ amount: 25, foo: 1 }).success).toBe(false);
  });
});

// ════════════════════════════════════════════════════════════════════════════
//  VALIDATION SHAPES — fixed-data strict, reports passthrough
// ════════════════════════════════════════════════════════════════════════════
describe("validation shapes", () => {
  it("fixed-data create is strict (only title/description)", () => {
    expect(FixedDataValidation.createBody.safeParse({ title: "t", description: "d" }).success).toBe(true);
    expect(FixedDataValidation.createBody.safeParse({ title: "t" }).success).toBe(true);
    expect(FixedDataValidation.createBody.safeParse({ title: "t", evil: 1 }).success).toBe(false);
    expect(FixedDataValidation.createBody.safeParse({ description: "d" }).success).toBe(false); // title required
  });

  it("fixed-data update requires at least one field and is strict", () => {
    expect(FixedDataValidation.updateBody.safeParse({ title: "t" }).success).toBe(true);
    expect(FixedDataValidation.updateBody.safeParse({}).success).toBe(false);
    expect(FixedDataValidation.updateBody.safeParse({ title: "t", evil: 1 }).success).toBe(false);
  });

  it("report body preserves the rich nested payload (passthrough — frozen output)", () => {
    const r = ReportsValidation.leadReportBody.safeParse({
      startDate: "2026-01-01",
      data: { leads: [{ clientName: "a" }], summary: { total: 1 } },
      extraFlag: true,
    });
    expect(r.success).toBe(true);
    // the nested `data` object + unknown keys survive verbatim for the frozen generator
    expect(r.data.data.leads).toHaveLength(1);
    expect(r.data.extraFlag).toBe(true);
  });
});

// ════════════════════════════════════════════════════════════════════════════
//  FIX 1 — destructive lead DELETE is base-role-ADMIN ONLY (legacy parity)
// ════════════════════════════════════════════════════════════════════════════
describe("admin lead DELETE — base-role-ADMIN-only guard (FIX 1)", () => {
  function makeUsecase() {
    const deleteALead = vi.fn().mockResolvedValue({ id: 42, deleted: true });
    const usecase = new AdminLeadsUsecase(adminLeadsRepository, { deleteALead });
    return { usecase, deleteALead };
  }

  it("ALLOWS a base-role ADMIN (the legacy `token.role === 'ADMIN'` narrowing)", async () => {
    const { usecase, deleteALead } = makeUsecase();
    const out = await usecase.deleteLead({ id: 42, authUser: { id: 1, role: USER_ROLES.ADMIN } });
    expect(deleteALead).toHaveBeenCalledWith(42);
    expect(out).toEqual({ id: 42, deleted: true });
  });

  it("403s SUPER_ADMIN, isSuperSales, and an ADMIN sub-role (the privilege-widening fix)", async () => {
    const cases = [
      { id: 1, role: USER_ROLES.SUPER_ADMIN },
      { id: 2, role: USER_ROLES.SUPER_SALES, isSuperSales: true },
      { id: 3, role: USER_ROLES.STAFF, subRoles: [{ subRole: USER_ROLES.ADMIN }] },
    ];
    for (const authUser of cases) {
      const { usecase, deleteALead } = makeUsecase();
      // the guard throws synchronously (before the cascading delete is reached)
      let err;
      try {
        usecase.deleteLead({ id: 42, authUser });
      } catch (e) {
        err = e;
      }
      expect(err).toBeInstanceOf(AppError);
      expect(err.statusCode).toBe(403);
      expect(err.message).toBe(authMessagesCodes.FORBIDDEN);
      expect(deleteALead).not.toHaveBeenCalled(); // never reaches the cascading delete
    }
  });
});

// ════════════════════════════════════════════════════════════════════════════
//  FIX 3 — generic single-field update cannot mass-assign ownership/status
// ════════════════════════════════════════════════════════════════════════════
describe("admin field-update mass-assignment guard (FIX 3)", () => {
  function makeUsecase() {
    const updateLeadField = vi.fn().mockResolvedValue({ id: 7 });
    const updateClientField = vi.fn().mockResolvedValue({ id: 9 });
    const usecase = new AdminLeadsUsecase(adminLeadsRepository, { updateLeadField, updateClientField });
    return { usecase, updateLeadField, updateClientField };
  }

  it("forwards ONLY { field, inputType, [field]: value } — extra body keys are dropped", async () => {
    const { usecase, updateLeadField } = makeUsecase();
    await usecase.updateLeadField({
      id: 7,
      // attacker stuffs ownership/workflow/money keys into a "field update" of `description`
      body: { field: "description", inputType: "text", description: "hi", userId: 999, status: "FINALIZED", averagePrice: 1 },
    });
    expect(updateLeadField).toHaveBeenCalledWith({
      data: { field: "description", inputType: "text", description: "hi" },
      leadId: 7,
    });
    const forwarded = updateLeadField.mock.calls[0][0].data;
    expect(forwarded).not.toHaveProperty("userId");
    expect(forwarded).not.toHaveProperty("status");
    expect(forwarded).not.toHaveProperty("averagePrice");
  });

  it("REJECTS naming a protected field directly (userId / status) with 403 — never touches the updater", async () => {
    const { usecase, updateLeadField } = makeUsecase();
    for (const field of ["userId", "status", "averagePrice", "clientId", "code"]) {
      // the protected-field guard throws synchronously before the frozen updater is called
      let err;
      try {
        usecase.updateLeadField({ id: 7, body: { field, inputType: "text", [field]: "x" } });
      } catch (e) {
        err = e;
      }
      expect(err).toBeInstanceOf(AppError);
      expect(err.statusCode).toBe(403);
      expect(err.message).toBe(authMessagesCodes.FORBIDDEN);
    }
    expect(updateLeadField).not.toHaveBeenCalled();
  });

  it("client field update is likewise minimized to the single named field", async () => {
    const { usecase, updateClientField } = makeUsecase();
    await usecase.updateClientField({
      clientId: 9,
      body: { field: "name", inputType: "text", name: "New", role: "ADMIN", isCleared: true },
    });
    expect(updateClientField).toHaveBeenCalledWith({
      data: { field: "name", inputType: "text", name: "New" },
      clientId: 9,
    });
  });
});

// ════════════════════════════════════════════════════════════════════════════
//  FIX 2 — staff latest-calls self-scopes to req.auth.id (IDOR)
// ════════════════════════════════════════════════════════════════════════════
describe("staff latest-calls self-scope (FIX 2)", () => {
  it("IGNORES a client ?staffId and forces the scope to req.auth.id", async () => {
    const getCallReminders = vi.fn().mockResolvedValue([]);
    const usecase = new StaffUsecase({ getCallReminders });

    await usecase.latestCalls({
      query: { staffId: 999, startDate: "2026-01-01", endDate: "2026-02-01" },
      authUser: { id: 7, role: USER_ROLES.STAFF },
    });

    const sp = getCallReminders.mock.calls[0][0];
    expect(sp.staffId).toBe(7); // forced to the caller's own id
    expect(sp.staffId).not.toBe(999);
    expect(sp.startDate).toBe("2026-01-01"); // rest of the query preserved
    expect(sp.endDate).toBe("2026-02-01");
  });

  it("with NO client staffId still self-scopes (never the all-staff global list)", async () => {
    const getCallReminders = vi.fn().mockResolvedValue([]);
    const usecase = new StaffUsecase({ getCallReminders });

    await usecase.latestCalls({ query: {}, authUser: { id: 12, role: USER_ROLES.THREE_D_DESIGNER } });
    expect(getCallReminders.mock.calls[0][0].staffId).toBe(12);
  });
});

// ════════════════════════════════════════════════════════════════════════════
//  LANGUAGE-NEUTRAL CODES — no Arabic/English prose in the message codes
// ════════════════════════════════════════════════════════════════════════════
describe("language-neutral message codes", () => {
  it("every admin-residual code is a SCREAMING_SNAKE_CASE token (no prose / spaces)", () => {
    for (const code of Object.values(adminResidualMessagesCodes)) {
      expect(code).toMatch(/^[A-Z0-9_]+$/);
    }
  });
});
