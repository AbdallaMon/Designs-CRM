import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the audit infra seam so contract usecases can be asserted without a DB.
vi.mock("../../../infra/audit/record-action.js", () => ({
  recordAction: vi.fn(),
  auditCtxFromReq: vi.fn(() => ({})),
}));

// DI-removal: the usecases now call directly-imported singletons + lazy service modules.
// Mock each seam so behavior can be asserted in isolation (no DB, no frozen PDF tier).
vi.mock("../contract/contract.repo.js", () => ({
  contractRepository: {
    getContractClientLeadId: vi.fn(),
    getPaymentClientLeadId: vi.fn(),
    getStageClientLeadId: vi.fn(),
    getDrawingClientLeadId: vi.fn(),
    getSpecialItemClientLeadId: vi.fn(),
  },
}));

vi.mock("../../leads/lead/lead.usecase.js", () => ({
  leadUsecase: {
    checkIfUserCanAccessLead: vi.fn(),
    checkIfUserCanMutateLead: vi.fn(),
  },
}));

vi.mock("../contract/contract.workflow.repo.js", () => ({
  getLeadContractList: vi.fn(),
  createContract: vi.fn(),
  getContractDetailsById: vi.fn(),
  updateContractBasics: vi.fn(),
  generatePdfSessionToken: vi.fn(),
  createContractStage: vi.fn(),
  updateContractStage: vi.fn(),
  deleteContractStage: vi.fn(),
  getContractPaymentsGroupedService: vi.fn(),
  updateContractPaymentStatus: vi.fn(),
  updateContractPaymentAmounts: vi.fn(),
  createNewContractPayment: vi.fn(),
  updateContractPayment: vi.fn(),
  deleteContractPayment: vi.fn(),
  createContractDrawing: vi.fn(),
  updateContractDrwaing: vi.fn(),
  deleteContractDrawing: vi.fn(),
  createContractSpecialItem: vi.fn(),
  updateContractSpecialItem: vi.fn(),
  deleteContractSpecialItem: vi.fn(),
}));

vi.mock("../services/contract-pdf.service.js", () => ({
  markContractAsCancelled: vi.fn(),
}));

vi.mock("../client/client-contract.repo.js", () => ({
  getContractSessionByToken: vi.fn(),
  getDefaultContractUtilityData: vi.fn(),
  changeContractSessionStatus: vi.fn(),
}));

vi.mock("../services/generate-contract-pdf.js", () => ({
  buildAndUploadContractPdf: vi.fn(),
}));

import { recordAction } from "../../../infra/audit/record-action.js";
import { AuthMiddleware } from "../../../shared/middlewares/auth.middleware.js";
import { AppError } from "../../../shared/errors/AppError.js";
import {
  PERMISSIONS,
  getEffectivePermissions,
  USER_ROLES,
  authMessagesCodes,
  contractsMessagesCodes,
} from "@dms/shared";

import { contractUsecase } from "../contract/contract.usecase.js";
import { ContractValidation } from "../contract/contract.validation.js";
import { clientContractUsecase } from "../client/client-contract.usecase.js";
import { ClientContractValidation } from "../client/client-contract.validation.js";
import { contractRepository } from "../contract/contract.repo.js";
import { leadUsecase } from "../../leads/lead/lead.usecase.js";
import * as contractServices from "../contract/contract.workflow.repo.js";
import { markContractAsCancelled } from "../services/contract-pdf.service.js";
import * as clientContractServices from "../client/client-contract.repo.js";
import { buildAndUploadContractPdf } from "../services/generate-contract-pdf.js";

const P = PERMISSIONS.CONTRACT;

function makeReq(persona, superSales = false) {
  const currentProfileKey = superSales
    ? "SUPER_SALES"
    : {
        ADMIN: "ADMIN",
        SUPER_ADMIN: "SUPER_ADMIN",
        STAFF: "NORMAL_SALES",
        THREE_D_DESIGNER: "DESIGNER_3D",
        TWO_D_DESIGNER: "DESIGNER_2D",
        TWO_D_EXECUTOR: "EXECUTOR_2D",
        ACCOUNTANT: "ACCOUNTANT",
        SUPER_SALES: "SUPER_SALES",
        CONTACT_INITIATOR: "CONTACT_INITIATOR",
      }[persona];
  const { permissions, permissionsByModule } = getEffectivePermissions({
    profile: currentProfileKey,
  });
  return {
    auth: {
      id: 1,
      currentProfileKey,
      isAdminTier: ["ADMIN", "SUPER_ADMIN"].includes(currentProfileKey),
      permissions,
      permissionsByModule,
    },
  };
}

// Fake leads checkers mirroring the keystone scope model:
//   - lead 100 → in READ + WRITE scope.
//   - lead 200 → READable (access) but NOT writable (mutate).
//   - anything else → out of scope: both denied.
function installLeadScope() {
  leadUsecase.checkIfUserCanAccessLead.mockImplementation(async ({ id }) => {
    if (Number(id) === 100) return { id: 100 };
    if (Number(id) === 200) return { id: 200 };
    throw new AppError({ code: "LEAD_ACCESS_DENIED", statusCode: 403 });
  });
  leadUsecase.checkIfUserCanMutateLead.mockImplementation(async ({ id }) => {
    if (Number(id) === 100) return { id: 100 };
    throw new AppError({ code: "LEAD_MUTATE_DENIED", statusCode: 403 });
  });
}

// Contract/child rows all resolve to clientLeadId 100 (in-scope) unless the id is 999
// (missing → null). Individual tests override to relocate a row to another lead.
function installRepoScope(clientLeadId = 100) {
  const resolve = (idKey) => async (arg) => {
    const id = arg[idKey];
    if (Number(id) === 999) return null;
    return { id: Number(id), contractId: 7, clientLeadId };
  };
  contractRepository.getContractClientLeadId.mockImplementation(async ({ contractId }) =>
    Number(contractId) === 999 ? null : { id: Number(contractId), clientLeadId },
  );
  contractRepository.getPaymentClientLeadId.mockImplementation(resolve("paymentId"));
  contractRepository.getStageClientLeadId.mockImplementation(resolve("stageId"));
  contractRepository.getDrawingClientLeadId.mockImplementation(resolve("drawId"));
  contractRepository.getSpecialItemClientLeadId.mockImplementation(resolve("specialItemId"));
}

beforeEach(() => {
  vi.clearAllMocks();
  installLeadScope();
  installRepoScope(100);
});

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
    expect(err.message).toBe(authMessagesCodes.PERMISSION_DENIED);
  });
});

// ════════════════════════════════════════════════════════════════════════════
//  OBJECT SCOPE — the IDOR fix (reads access-scope, writes mutate-scope)
// ════════════════════════════════════════════════════════════════════════════
describe("ContractUsecase object scope (the IDOR fix)", () => {
  it("listForLead: READ path uses access-scope, allows an in-scope lead", async () => {
    contractServices.getLeadContractList.mockResolvedValue([{ id: 1 }]);
    const out = await contractUsecase.listLeadContracts({ leadId: 100, authUser: AUTH });
    expect(out).toEqual([{ id: 1 }]);
    expect(leadUsecase.checkIfUserCanAccessLead).toHaveBeenCalledWith({ id: 100, authUser: AUTH });
    expect(leadUsecase.checkIfUserCanMutateLead).not.toHaveBeenCalled();
  });

  it("listForLead: DENIES an out-of-scope lead and never reads", async () => {
    await expect(contractUsecase.listLeadContracts({ leadId: 999, authUser: AUTH })).rejects.toMatchObject({ statusCode: 403 });
    expect(contractServices.getLeadContractList).not.toHaveBeenCalled();
  });

  it("create: WRITE uses mutate-scope on the body's clientLeadId; allows owner", async () => {
    contractServices.createContract.mockResolvedValue({ id: 7 });
    await contractUsecase.createContract({ payload: { clientLeadId: 100 }, authUser: AUTH });
    expect(leadUsecase.checkIfUserCanMutateLead).toHaveBeenCalledWith({ id: 100, authUser: AUTH });
    expect(contractServices.createContract).toHaveBeenCalledWith({ payload: { clientLeadId: 100 } });
  });

  it("create: records a CONTRACT_CREATED audit event once with the new contract id", async () => {
    recordAction.mockClear();
    contractServices.createContract.mockResolvedValue({ id: 7, clientLeadId: 100 });
    await contractUsecase.createContract({ payload: { clientLeadId: 100 }, authUser: AUTH, auditCtx: {} });
    expect(recordAction).toHaveBeenCalledTimes(1);
    expect(recordAction).toHaveBeenCalledWith(
      {},
      expect.objectContaining({
        module: "contract",
        action: "CONTRACT_CREATED",
        entityType: "Contract",
        entityId: 7,
        clientLeadId: 100,
      }),
    );
  });

  it("updatePaymentStatus: records CONTRACT_PAYMENT_PAID only for a paid status", async () => {
    contractServices.updateContractPaymentStatus.mockResolvedValue(undefined);

    recordAction.mockClear();
    await contractUsecase.updatePaymentStatus({ paymentId: 42, status: "DUE", authUser: AUTH, auditCtx: {} });
    expect(recordAction).not.toHaveBeenCalled();

    recordAction.mockClear();
    await contractUsecase.updatePaymentStatus({ paymentId: 42, status: "RECEIVED", authUser: AUTH, auditCtx: {} });
    expect(recordAction).toHaveBeenCalledTimes(1);
    expect(recordAction).toHaveBeenCalledWith(
      {},
      expect.objectContaining({
        module: "contract",
        action: "CONTRACT_PAYMENT_PAID",
        entityType: "ContractPayment",
        entityId: 42,
        clientLeadId: 100,
      }),
    );
  });

  it("create: DENIES a lead that is only READable (mutate-scope, not read-scope)", async () => {
    await expect(contractUsecase.createContract({ payload: { clientLeadId: 200 }, authUser: AUTH })).rejects.toMatchObject({
      statusCode: 403,
    });
    expect(contractServices.createContract).not.toHaveBeenCalled();
  });

  it("getById: resolves contract→lead and uses ACCESS scope (read)", async () => {
    contractServices.getContractDetailsById.mockResolvedValue({ id: 7 });
    await contractUsecase.getContractById({ contractId: 7, authUser: AUTH });
    expect(contractRepository.getContractClientLeadId).toHaveBeenCalledWith({ contractId: 7 });
    expect(leadUsecase.checkIfUserCanAccessLead).toHaveBeenCalledWith({ id: 100, authUser: AUTH });
    expect(contractServices.getContractDetailsById).toHaveBeenCalledWith({ contractId: 7 });
  });

  it("getById: 404s a missing/forged contract id before reading", async () => {
    await expect(contractUsecase.getContractById({ contractId: 999, authUser: AUTH })).rejects.toMatchObject({
      statusCode: 404,
      message: contractsMessagesCodes.CONTRACT_NOT_FOUND,
    });
    expect(contractServices.getContractDetailsById).not.toHaveBeenCalled();
  });

  it("cancel: resolves contract→lead and uses MUTATE scope; DENIES read-only-scope lead", async () => {
    installRepoScope(200); // contract belongs to lead 200 (read-only scope)
    await expect(contractUsecase.cancelContract({ contractId: 7, authUser: AUTH })).rejects.toMatchObject({ statusCode: 403 });
    expect(leadUsecase.checkIfUserCanMutateLead).toHaveBeenCalledWith({ id: 200, authUser: AUTH });
    expect(markContractAsCancelled).not.toHaveBeenCalled();
  });

  it("updatePayment: resolves payment→contract→lead (child-id resolution) and MUTATE-scopes", async () => {
    contractServices.updateContractPayment.mockResolvedValue(true);
    await contractUsecase.updatePayment({ paymentId: 42, newPayment: { amount: 10 }, authUser: AUTH });
    expect(contractRepository.getPaymentClientLeadId).toHaveBeenCalledWith({ paymentId: 42 });
    expect(leadUsecase.checkIfUserCanMutateLead).toHaveBeenCalledWith({ id: 100, authUser: AUTH });
    expect(contractServices.updateContractPayment).toHaveBeenCalledWith({ paymentId: 42, newPayment: { amount: 10 } });
  });

  it("deleteStage: 404s a forged stage id before the legacy delete runs", async () => {
    await expect(contractUsecase.deleteStage({ contractId: 7, stageId: 999, authUser: AUTH })).rejects.toMatchObject({
      statusCode: 404,
    });
    expect(contractServices.deleteContractStage).not.toHaveBeenCalled();
  });

  it("paymentsGrouped: passes req.auth as `user` (frozen-service role-scope preserved)", async () => {
    contractServices.getContractPaymentsGroupedService.mockResolvedValue({ items: [], total: 0 });
    await contractUsecase.getGroupedPayments({ page: 2, limit: 5, status: "DUE", authUser: AUTH });
    expect(contractServices.getContractPaymentsGroupedService).toHaveBeenCalledWith({
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
    clientContractServices.changeContractSessionStatus.mockResolvedValue({ id: 1 });
    await clientContractUsecase.changeStatus({ token: "tok-abc", sessionStatus: "VIEWING" });
    expect(clientContractServices.changeContractSessionStatus).toHaveBeenCalledWith({ token: "tok-abc", sessionStatus: "VIEWING" });
    // the legacy `id` selector is NOT forwarded — no key but token.
    const arg = clientContractServices.changeContractSessionStatus.mock.calls[0][0];
    expect(arg).not.toHaveProperty("id");
  });

  it("changeStatus throws CONTRACT_SESSION_INVALID when no token", async () => {
    await expect(clientContractUsecase.changeStatus({ token: "", sessionStatus: "VIEWING" })).rejects.toMatchObject({
      statusCode: 400,
      message: contractsMessagesCodes.CONTRACT_SESSION_INVALID,
    });
  });

  it("generatePdf operates ONLY on the token's session (SIGNING → 🔒 build → REGISTERED)", async () => {
    clientContractServices.getContractSessionByToken.mockResolvedValue({ id: 1 });
    clientContractServices.changeContractSessionStatus.mockResolvedValue({});
    buildAndUploadContractPdf.mockResolvedValue({});
    await clientContractUsecase.generatePdf({ token: "tok-xyz", signatureUrl: "s.png", lng: "ar" });

    // every session mutation is keyed by the SAME token; the PDF builder gets that token.
    expect(clientContractServices.changeContractSessionStatus).toHaveBeenCalledTimes(2);
    expect(clientContractServices.changeContractSessionStatus.mock.calls[0][0]).toMatchObject({ token: "tok-xyz", sessionStatus: "SIGNING" });
    expect(clientContractServices.changeContractSessionStatus.mock.calls[1][0]).toMatchObject({ token: "tok-xyz", sessionStatus: "REGISTERED" });
    expect(buildAndUploadContractPdf).toHaveBeenCalledWith({ token: "tok-xyz", signatureUrl: "s.png", lng: "ar" });
  });

  it("generatePdf maps a frozen-builder failure to a language-neutral code (no prose)", async () => {
    clientContractServices.getContractSessionByToken.mockResolvedValue({ id: 1 });
    clientContractServices.changeContractSessionStatus.mockResolvedValue({});
    buildAndUploadContractPdf.mockRejectedValue(new Error("boom"));
    await expect(clientContractUsecase.generatePdf({ token: "t", signatureUrl: "s", lng: "ar" })).rejects.toMatchObject({
      statusCode: 500,
      message: contractsMessagesCodes.CONTRACT_PDF_GENERATION_FAILED,
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
