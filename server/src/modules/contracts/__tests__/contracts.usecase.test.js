import { describe, it, expect, vi } from "vitest";

import { AuthMiddleware } from "../../../shared/middlewares/auth.middleware.js";
import { AppError } from "../../../shared/errors/AppError.js";
import {
  PERMISSIONS,
  getEffectivePermissions,
  USER_ROLES,
  authMessagesCodes,
  contractsMessagesCodes,
} from "@dms/shared";

import { ContractUsecase } from "../contract/contract.usecase.js";
import { ContractValidation } from "../contract/contract.validation.js";
import { ClientContractUsecase } from "../client/client-contract.usecase.js";
import { ClientContractValidation } from "../client/client-contract.validation.js";

const C = contractsMessagesCodes;
const P = PERMISSIONS.CONTRACT;

function makeReq(role, isSuperSales = false) {
  const { permissions, permissionsByModule } = getEffectivePermissions({ role, isSuperSales });
  return { auth: { id: 1, role, isSuperSales, permissions, permissionsByModule } };
}

// Fake leads checkers mirroring the keystone scope model:
//   - lead 100 → in READ + WRITE scope.
//   - lead 200 → READable (access) but NOT writable (mutate).
//   - anything else → out of scope: both denied.
function makeLeads() {
  return {
    checkIfUserCanAccessLead: vi.fn(async ({ id }) => {
      if (Number(id) === 100) return { id: 100 };
      if (Number(id) === 200) return { id: 200 };
      throw new AppError("LEAD_ACCESS_DENIED", 403);
    }),
    checkIfUserCanMutateLead: vi.fn(async ({ id }) => {
      if (Number(id) === 100) return { id: 100 };
      throw new AppError("LEAD_MUTATE_DENIED", 403);
    }),
  };
}

// A repo whose contract/child rows all resolve to clientLeadId 100 (in-scope) unless the
// id is 999 (missing → null).
function makeRepo(clientLeadId = 100) {
  const resolve = (idKey) =>
    vi.fn(async (arg) => {
      const id = arg[idKey];
      if (Number(id) === 999) return null;
      return { id: Number(id), contractId: 7, clientLeadId };
    });
  return {
    getContractClientLeadId: vi.fn(async ({ contractId }) =>
      Number(contractId) === 999 ? null : { id: Number(contractId), clientLeadId },
    ),
    getPaymentClientLeadId: resolve("paymentId"),
    getStageClientLeadId: resolve("stageId"),
    getDrawingClientLeadId: resolve("drawId"),
    getSpecialItemClientLeadId: resolve("specialItemId"),
  };
}

const AUTH = { id: 5, role: "STAFF" };

// ════════════════════════════════════════════════════════════════════════════
//  ROLE PARITY — every one of the 9 authed roles passes the SHARED contract gate
// ════════════════════════════════════════════════════════════════════════════
describe("contracts authed surface — role parity (legacy SHARED gate = all 9 roles)", () => {
  const ALL_ROLES = [
    USER_ROLES.ADMIN,
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.STAFF,
    USER_ROLES.THREE_D_DESIGNER,
    USER_ROLES.TWO_D_DESIGNER,
    USER_ROLES.TWO_D_EXECUTOR,
    USER_ROLES.ACCOUNTANT,
    USER_ROLES.SUPER_SALES,
    USER_ROLES.CONTACT_INITIATOR,
  ];

  for (const role of ALL_ROLES) {
    it(`${role} passes the contract LIST + CREATE + PAYMENT_MANAGE gates`, () => {
      const req = makeReq(role);
      for (const code of [P.LIST, P.VIEW, P.CREATE, P.EDIT, P.CANCEL, P.PAYMENT_MANAGE, P.PAYMENT_LIST]) {
        const next = vi.fn();
        AuthMiddleware.requirePermissions([code])(req, {}, next);
        expect(next, `${role} should hold ${code}`).toHaveBeenCalledWith();
      }
    });
  }

  it("a user with NO permissions is 403'd on a contract gate (sanity)", () => {
    const req = { auth: { id: 1, permissions: [] } };
    const next = vi.fn();
    AuthMiddleware.requirePermissions([P.CREATE])(req, {}, next);
    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(403);
    expect(err.message).toBe(authMessagesCodes.FORBIDDEN);
  });
});

// ════════════════════════════════════════════════════════════════════════════
//  OBJECT SCOPE — the IDOR fix (reads access-scope, writes mutate-scope)
// ════════════════════════════════════════════════════════════════════════════
describe("ContractUsecase object scope (the IDOR fix)", () => {
  it("listForLead: READ path uses access-scope, allows an in-scope lead", async () => {
    const leads = makeLeads();
    const legacy = { getLeadContractList: vi.fn().mockResolvedValue([{ id: 1 }]) };
    const uc = new ContractUsecase(makeRepo(), leads, legacy);
    const out = await uc.listForLead({ leadId: 100, authUser: AUTH });
    expect(out).toEqual([{ id: 1 }]);
    expect(leads.checkIfUserCanAccessLead).toHaveBeenCalledWith({ id: 100, authUser: AUTH });
    expect(leads.checkIfUserCanMutateLead).not.toHaveBeenCalled();
  });

  it("listForLead: DENIES an out-of-scope lead and never reads", async () => {
    const legacy = { getLeadContractList: vi.fn() };
    const uc = new ContractUsecase(makeRepo(), makeLeads(), legacy);
    await expect(uc.listForLead({ leadId: 999, authUser: AUTH })).rejects.toMatchObject({ statusCode: 403 });
    expect(legacy.getLeadContractList).not.toHaveBeenCalled();
  });

  it("create: WRITE uses mutate-scope on the body's clientLeadId; allows owner", async () => {
    const leads = makeLeads();
    const legacy = { createContract: vi.fn().mockResolvedValue({ id: 7 }) };
    const uc = new ContractUsecase(makeRepo(), leads, legacy);
    await uc.create({ payload: { clientLeadId: 100 }, authUser: AUTH });
    expect(leads.checkIfUserCanMutateLead).toHaveBeenCalledWith({ id: 100, authUser: AUTH });
    expect(legacy.createContract).toHaveBeenCalledWith({ payload: { clientLeadId: 100 } });
  });

  it("create: DENIES a lead that is only READable (mutate-scope, not read-scope)", async () => {
    const legacy = { createContract: vi.fn() };
    const uc = new ContractUsecase(makeRepo(), makeLeads(), legacy);
    await expect(uc.create({ payload: { clientLeadId: 200 }, authUser: AUTH })).rejects.toMatchObject({
      statusCode: 403,
    });
    expect(legacy.createContract).not.toHaveBeenCalled();
  });

  it("getById: resolves contract→lead and uses ACCESS scope (read)", async () => {
    const leads = makeLeads();
    const repo = makeRepo(100);
    const legacy = { getContractDetailsById: vi.fn().mockResolvedValue({ id: 7 }) };
    const uc = new ContractUsecase(repo, leads, legacy);
    await uc.getById({ contractId: 7, authUser: AUTH });
    expect(repo.getContractClientLeadId).toHaveBeenCalledWith({ contractId: 7 });
    expect(leads.checkIfUserCanAccessLead).toHaveBeenCalledWith({ id: 100, authUser: AUTH });
    expect(legacy.getContractDetailsById).toHaveBeenCalledWith({ contractId: 7 });
  });

  it("getById: 404s a missing/forged contract id before reading", async () => {
    const legacy = { getContractDetailsById: vi.fn() };
    const uc = new ContractUsecase(makeRepo(), makeLeads(), legacy);
    await expect(uc.getById({ contractId: 999, authUser: AUTH })).rejects.toMatchObject({
      statusCode: 404,
      message: C.CONTRACT_NOT_FOUND,
    });
    expect(legacy.getContractDetailsById).not.toHaveBeenCalled();
  });

  it("cancel: resolves contract→lead and uses MUTATE scope; DENIES read-only-scope lead", async () => {
    const leads = makeLeads();
    const repo = makeRepo(200); // contract belongs to lead 200 (read-only scope)
    const legacy = { markContractAsCancelled: vi.fn() };
    const uc = new ContractUsecase(repo, leads, legacy);
    await expect(uc.cancel({ contractId: 7, authUser: AUTH })).rejects.toMatchObject({ statusCode: 403 });
    expect(leads.checkIfUserCanMutateLead).toHaveBeenCalledWith({ id: 200, authUser: AUTH });
    expect(legacy.markContractAsCancelled).not.toHaveBeenCalled();
  });

  it("updatePayment: resolves payment→contract→lead (child-id resolution) and MUTATE-scopes", async () => {
    const leads = makeLeads();
    const repo = makeRepo(100);
    const legacy = { updateContractPayment: vi.fn().mockResolvedValue(true) };
    const uc = new ContractUsecase(repo, leads, legacy);
    await uc.updatePayment({ paymentId: 42, newPayment: { amount: 10 }, authUser: AUTH });
    expect(repo.getPaymentClientLeadId).toHaveBeenCalledWith({ paymentId: 42 });
    expect(leads.checkIfUserCanMutateLead).toHaveBeenCalledWith({ id: 100, authUser: AUTH });
    expect(legacy.updateContractPayment).toHaveBeenCalledWith({ paymentId: 42, newPayment: { amount: 10 } });
  });

  it("deleteStage: 404s a forged stage id before the legacy delete runs", async () => {
    const legacy = { deleteContractStage: vi.fn() };
    const uc = new ContractUsecase(makeRepo(), makeLeads(), legacy);
    await expect(uc.deleteStage({ contractId: 7, stageId: 999, authUser: AUTH })).rejects.toMatchObject({
      statusCode: 404,
    });
    expect(legacy.deleteContractStage).not.toHaveBeenCalled();
  });

  it("paymentsGrouped: passes req.auth as `user` (frozen-service role-scope preserved)", async () => {
    const legacy = { getContractPaymentsGroupedService: vi.fn().mockResolvedValue({ items: [], total: 0 }) };
    const uc = new ContractUsecase(makeRepo(), makeLeads(), legacy);
    await uc.paymentsGrouped({ page: 2, limit: 5, status: "DUE", authUser: AUTH });
    expect(legacy.getContractPaymentsGroupedService).toHaveBeenCalledWith({
      page: 2,
      limit: 5,
      status: "DUE",
      user: AUTH,
    });
  });
});

// ════════════════════════════════════════════════════════════════════════════
//  PUBLIC SIGNING — token authoritative, no body override (IDOR safety)
// ════════════════════════════════════════════════════════════════════════════
describe("ClientContractUsecase public signing — token is authoritative", () => {
  it("changeStatus keys the session by the TOKEN only (no client id override)", async () => {
    const changeContractSessionStatus = vi.fn().mockResolvedValue({ id: 1 });
    const uc = new ClientContractUsecase({ changeContractSessionStatus });
    await uc.changeStatus({ token: "tok-abc", sessionStatus: "VIEWING" });
    expect(changeContractSessionStatus).toHaveBeenCalledWith({ token: "tok-abc", sessionStatus: "VIEWING" });
    // the legacy `id` selector is NOT forwarded — no key but token.
    const arg = changeContractSessionStatus.mock.calls[0][0];
    expect(arg).not.toHaveProperty("id");
  });

  it("changeStatus throws CONTRACT_SESSION_INVALID when no token", async () => {
    const uc = new ClientContractUsecase({ changeContractSessionStatus: vi.fn() });
    await expect(uc.changeStatus({ token: "", sessionStatus: "VIEWING" })).rejects.toMatchObject({
      statusCode: 400,
      message: C.CONTRACT_SESSION_INVALID,
    });
  });

  it("generatePdf operates ONLY on the token's session (SIGNING → 🔒 build → REGISTERED)", async () => {
    const changeContractSessionStatus = vi.fn().mockResolvedValue({});
    const buildAndUploadContractPdf = vi.fn().mockResolvedValue({});
    const uc = new ClientContractUsecase({ changeContractSessionStatus, buildAndUploadContractPdf });
    await uc.generatePdf({ token: "tok-xyz", signatureUrl: "s.png", lng: "ar" });

    // every session mutation is keyed by the SAME token; the PDF builder gets that token.
    expect(changeContractSessionStatus).toHaveBeenCalledTimes(2);
    expect(changeContractSessionStatus.mock.calls[0][0]).toMatchObject({ token: "tok-xyz", sessionStatus: "SIGNING" });
    expect(changeContractSessionStatus.mock.calls[1][0]).toMatchObject({ token: "tok-xyz", sessionStatus: "REGISTERED" });
    expect(buildAndUploadContractPdf).toHaveBeenCalledWith({ token: "tok-xyz", signatureUrl: "s.png", lng: "ar" });
  });

  it("generatePdf maps a frozen-builder failure to a language-neutral code (no prose)", async () => {
    const uc = new ClientContractUsecase({
      changeContractSessionStatus: vi.fn().mockResolvedValue({}),
      buildAndUploadContractPdf: vi.fn().mockRejectedValue(new Error("boom")),
    });
    await expect(uc.generatePdf({ token: "t", signatureUrl: "s", lng: "ar" })).rejects.toMatchObject({
      statusCode: 500,
      message: C.CONTRACT_PDF_GENERATION_FAILED,
    });
  });
});

// ════════════════════════════════════════════════════════════════════════════
//  VALIDATION — money + mass-assignment + body-override safety
// ════════════════════════════════════════════════════════════════════════════
describe("contracts validation — money + mass-assignment", () => {
  it("create: rejects a negative payment amount (money guard)", () => {
    const r = ContractValidation.create.safeParse({
      clientLeadId: 1,
      payments: [{ amount: -5 }],
      stages: [{ levelEnum: "LEVEL_1" }],
    });
    expect(r.success).toBe(false);
  });

  it("create: rejects a NaN payment amount", () => {
    const r = ContractValidation.create.safeParse({
      clientLeadId: 1,
      payments: [{ amount: "abc" }],
      stages: [{ levelEnum: "LEVEL_1" }],
    });
    expect(r.success).toBe(false);
  });

  it("create: accepts a valid contract (amount coerced from string)", () => {
    const r = ContractValidation.create.safeParse({
      clientLeadId: 1,
      title: "Villa",
      payments: [{ amount: "100.5", condition: "SIGNATURE" }],
      stages: [{ levelEnum: "LEVEL_1", deliveryDays: 5, deptDeliveryDays: 3 }],
    });
    expect(r.success).toBe(true);
    expect(r.data.payments[0].amount).toBe(100.5);
  });

  it("create: rejects an injected unknown field (.strict mass-assignment guard)", () => {
    const r = ContractValidation.create.safeParse({
      clientLeadId: 1,
      payments: [{ amount: 10 }],
      stages: [{ levelEnum: "LEVEL_1" }],
      status: "COMPLETED", // injected — must be rejected
    });
    expect(r.success).toBe(false);
  });

  it("updatePaymentAmounts: rejects a negative amountLost", () => {
    const r = ContractValidation.updatePaymentAmounts.safeParse({ amountLost: -1, amountReceived: 5 });
    expect(r.success).toBe(false);
  });

  it("changePaymentStatus: rejects an unknown body field", () => {
    const r = ContractValidation.changePaymentStatus.safeParse({ status: "RECEIVED", paymentId: 9 });
    expect(r.success).toBe(false);
  });

  it("public changeStatus: rejects a client-supplied `id` (no session override)", () => {
    const r = ClientContractValidation.changeStatus.safeParse({
      token: "t",
      sessionStatus: "VIEWING",
      id: 999, // attempt to target another session — must be rejected by .strict()
    });
    expect(r.success).toBe(false);
  });

  it("public generatePdf: requires sessionData.arToken + signatureUrl", () => {
    const ok = ClientContractValidation.generatePdf.safeParse({
      sessionData: { arToken: "tok" },
      signatureUrl: "/uploads/abc-123.png", // legitimate relative upload path
      lng: "ar",
    });
    expect(ok.success).toBe(true);
    const bad = ClientContractValidation.generatePdf.safeParse({
      sessionData: {},
      signatureUrl: "/uploads/abc-123.png",
    });
    expect(bad.success).toBe(false);
  });

  // ── SSRF hardening: signatureUrl must be a safe relative upload path ──
  it("public generatePdf: ACCEPTS a legitimate relative signature path (the real shape)", () => {
    // matches uploadAsChunk.js output `/uploads/<uuid>.png` submitted verbatim by the FE
    for (const sig of [
      "/uploads/3f2a-9c11.png",
      "/uploads/sig.jpg",
      "/uploads/sig.jpeg",
      "/uploads/thumb/x.webp",
    ]) {
      const r = ClientContractValidation.generatePdf.safeParse({
        sessionData: { arToken: "tok" },
        signatureUrl: sig,
        lng: "ar",
      });
      expect(r.success, sig).toBe(true);
    }
  });

  it("public generatePdf: REJECTS SSRF / traversal signatureUrl payloads", () => {
    for (const sig of [
      ".attacker.com/x.png", // no leading slash + host
      "//evil.com/x.png", // protocol-relative host hijack
      "http://evil/x.png", // absolute scheme
      "https://evil.com/x.png",
      "data:image/png;base64,AAAA", // data URI
      "/../../etc/passwd", // path traversal (also bad ext)
      "/uploads/../../../etc/passwd.png", // traversal with allowed ext
      "/foo/@evil/x.png", // userinfo@host trick
      "/uploads/x.svg", // disallowed extension
      "/uploads/x.png?host=evil.com", // disallowed char (query)
    ]) {
      const r = ClientContractValidation.generatePdf.safeParse({
        sessionData: { arToken: "tok" },
        signatureUrl: sig,
        lng: "ar",
      });
      expect(r.success, sig).toBe(false);
    }
  });

  // ── sessionStatus enum hardening (clean 422 instead of DB error) ──
  it("public changeStatus: ACCEPTS valid ContractSessionStatus enum values", () => {
    for (const s of ["INITIAL", "SIGNING", "REGISTERED"]) {
      const r = ClientContractValidation.changeStatus.safeParse({ token: "t", sessionStatus: s });
      expect(r.success, s).toBe(true);
    }
  });

  it("public changeStatus: REJECTS an invalid sessionStatus", () => {
    for (const s of ["VIEWING", "signing", "", "DELETED"]) {
      const r = ClientContractValidation.changeStatus.safeParse({ token: "t", sessionStatus: s });
      expect(r.success, s).toBe(false);
    }
  });

  it("contractId param: rejects a non-numeric id", () => {
    const r = ContractValidation.contractIdParam.safeParse({ contractId: "abc" });
    expect(r.success).toBe(false);
  });
});
