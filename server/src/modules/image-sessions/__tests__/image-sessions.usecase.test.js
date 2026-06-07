import { describe, it, expect, vi } from "vitest";

import { AuthMiddleware } from "../../../shared/middlewares/auth.middleware.js";
import { AppError } from "../../../shared/errors/AppError.js";
import {
  PERMISSIONS,
  getEffectivePermissions,
  USER_ROLES,
  authMessagesCodes,
  imageSessionsMessagesCodes,
} from "@dms/shared";

import { ImageSessionUsecase } from "../session/image-session.usecase.js";
import { ImageSessionValidation } from "../session/image-session.validation.js";
import { ClientImageSessionUsecase } from "../client/client-image-session.usecase.js";
import { ClientImageSessionValidation } from "../client/client-image-session.validation.js";

const M = imageSessionsMessagesCodes;
const P = PERMISSIONS.IMAGE_SESSION;

function makeReq(role, isSuperSales = false) {
  const { permissions, permissionsByModule } = getEffectivePermissions({ role, isSuperSales });
  return { auth: { id: 1, role, isSuperSales, permissions, permissionsByModule } };
}

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

// leads keystone fake: lead 100 → read+write; lead 200 → read-only; else → denied.
function makeLeads() {
  return {
    checkIfUserCanAccessLead: vi.fn(async ({ id }) => {
      if (Number(id) === 100 || Number(id) === 200) return { id: Number(id) };
      throw new AppError("LEAD_ACCESS_DENIED", 403);
    }),
    checkIfUserCanMutateLead: vi.fn(async ({ id }) => {
      if (Number(id) === 100) return { id: 100 };
      throw new AppError("LEAD_MUTATE_DENIED", 403);
    }),
  };
}

// session repo: session resolves to a given clientLeadId; sessionId 999 → null (forged).
function makeRepo(clientLeadId = 100) {
  return {
    getSessionClientLeadId: vi.fn(async ({ sessionId }) =>
      Number(sessionId) === 999 ? null : { id: Number(sessionId), clientLeadId },
    ),
  };
}

const AUTH = { id: 5, role: "STAFF" };

// ════════════════════════════════════════════════════════════════════════════
//  ADMIN-CODE ROLE PARITY — the `isAdmin` union passes; a plain STAFF/sales is 403'd
// ════════════════════════════════════════════════════════════════════════════
describe("image-sessions ADMIN surface — role parity (legacy `/admin/image-session` ADMIN gate)", () => {
  it("ADMIN + SUPER_ADMIN hold the admin reference-data codes", () => {
    for (const role of [USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN]) {
      const req = makeReq(role);
      for (const code of [P.ADMIN_VIEW, P.ADMIN_MANAGE]) {
        const next = vi.fn();
        AuthMiddleware.requirePermissions([code])(req, {}, next);
        expect(next, `${role} should hold ${code}`).toHaveBeenCalledWith();
      }
    }
  });

  it("isSuperSales holds the admin reference-data codes (matches legacy `isAdmin` union)", () => {
    const req = makeReq(USER_ROLES.SUPER_SALES, true);
    for (const code of [P.ADMIN_VIEW, P.ADMIN_MANAGE]) {
      const next = vi.fn();
      AuthMiddleware.requirePermissions([code])(req, {}, next);
      expect(next, `isSuperSales should hold ${code}`).toHaveBeenCalledWith();
    }
  });

  it("the KEY parity check: a plain STAFF / sales / designer role is 403'd on the admin surface", () => {
    for (const role of [
      USER_ROLES.STAFF,
      USER_ROLES.SUPER_SALES, // base SUPER_SALES WITHOUT the isSuperSales flag
      USER_ROLES.THREE_D_DESIGNER,
      USER_ROLES.TWO_D_DESIGNER,
      USER_ROLES.TWO_D_EXECUTOR,
      USER_ROLES.ACCOUNTANT,
      USER_ROLES.CONTACT_INITIATOR,
    ]) {
      const req = makeReq(role);
      const next = vi.fn();
      AuthMiddleware.requirePermissions([P.ADMIN_MANAGE])(req, {}, next);
      const err = next.mock.calls[0][0];
      expect(err, `${role} must be denied ADMIN_MANAGE`).toBeInstanceOf(AppError);
      expect(err.statusCode).toBe(403);
      expect(err.message).toBe(authMessagesCodes.FORBIDDEN);
    }
  });
});

// ════════════════════════════════════════════════════════════════════════════
//  SHARED SESSION ROLE PARITY — every one of the 9 authed roles passes the SESSION gate
// ════════════════════════════════════════════════════════════════════════════
describe("image-sessions SHARED surface — role parity (legacy SHARED gate = all 9 roles)", () => {
  for (const role of ALL_ROLES) {
    it(`${role} holds SESSION_VIEW + SESSION_MANAGE`, () => {
      const req = makeReq(role);
      for (const code of [P.SESSION_VIEW, P.SESSION_MANAGE]) {
        const next = vi.fn();
        AuthMiddleware.requirePermissions([code])(req, {}, next);
        expect(next, `${role} should hold ${code}`).toHaveBeenCalledWith();
      }
    });
  }

  it("a plain authed role does NOT get the admin reference-data code via the SHARED grant", () => {
    const req = makeReq(USER_ROLES.STAFF);
    const next = vi.fn();
    AuthMiddleware.requirePermissions([P.ADMIN_VIEW])(req, {}, next);
    expect(next.mock.calls[0][0]).toBeInstanceOf(AppError);
  });
});

// ════════════════════════════════════════════════════════════════════════════
//  SHARED SESSION OBJECT SCOPE — the IDOR fix (reads access-scope, writes mutate-scope)
// ════════════════════════════════════════════════════════════════════════════
describe("ImageSessionUsecase object scope (the IDOR fix)", () => {
  it("listForLead: READ path uses access-scope, allows an in-scope lead", async () => {
    const leads = makeLeads();
    const legacy = { getClientImageSessions: vi.fn().mockResolvedValue([{ id: 1 }]) };
    const uc = new ImageSessionUsecase(makeRepo(), leads, legacy);
    const out = await uc.listForLead({ clientLeadId: 100, authUser: AUTH });
    expect(out).toEqual([{ id: 1 }]);
    expect(leads.checkIfUserCanAccessLead).toHaveBeenCalledWith({ id: 100, authUser: AUTH });
    expect(leads.checkIfUserCanMutateLead).not.toHaveBeenCalled();
  });

  it("listForLead: DENIES an out-of-scope lead and never reads", async () => {
    const legacy = { getClientImageSessions: vi.fn() };
    const uc = new ImageSessionUsecase(makeRepo(), makeLeads(), legacy);
    await expect(uc.listForLead({ clientLeadId: 777, authUser: AUTH })).rejects.toMatchObject({ statusCode: 403 });
    expect(legacy.getClientImageSessions).not.toHaveBeenCalled();
  });

  it("createForLead: WRITE uses mutate-scope; userId comes from req.auth, not the body", async () => {
    const leads = makeLeads();
    const legacy = { createClientImageSession: vi.fn().mockResolvedValue({ id: 7 }) };
    const uc = new ImageSessionUsecase(makeRepo(), leads, legacy);
    await uc.createForLead({ clientLeadId: 100, spaces: [1, 2], authUser: { id: 42, role: "STAFF" } });
    expect(leads.checkIfUserCanMutateLead).toHaveBeenCalledWith({ id: 100, authUser: { id: 42, role: "STAFF" } });
    expect(legacy.createClientImageSession).toHaveBeenCalledWith({
      clientLeadId: 100,
      userId: 42,
      selectedSpaceIds: [1, 2],
    });
  });

  it("createForLead: DENIES a read-only-scope lead (mutate-scope, not read-scope)", async () => {
    const legacy = { createClientImageSession: vi.fn() };
    const uc = new ImageSessionUsecase(makeRepo(), makeLeads(), legacy);
    await expect(uc.createForLead({ clientLeadId: 200, spaces: [1], authUser: AUTH })).rejects.toMatchObject({
      statusCode: 403,
    });
    expect(legacy.createClientImageSession).not.toHaveBeenCalled();
  });

  it("regenerateToken: resolves session→lead (sessionId resolution) and MUTATE-scopes", async () => {
    const leads = makeLeads();
    const repo = makeRepo(100);
    const legacy = { regenerateSessionToken: vi.fn().mockResolvedValue({ token: "t" }) };
    const uc = new ImageSessionUsecase(repo, leads, legacy);
    await uc.regenerateToken({ sessionId: 42, authUser: AUTH });
    expect(repo.getSessionClientLeadId).toHaveBeenCalledWith({ sessionId: 42 });
    expect(leads.checkIfUserCanMutateLead).toHaveBeenCalledWith({ id: 100, authUser: AUTH });
    expect(legacy.regenerateSessionToken).toHaveBeenCalledWith(42);
  });

  it("deleteSession: resolves session→lead; DENIES a read-only-scope lead before deleting", async () => {
    const leads = makeLeads();
    const repo = makeRepo(200); // session belongs to lead 200 (read-only scope)
    const legacy = { deleteInProgressSession: vi.fn() };
    const uc = new ImageSessionUsecase(repo, leads, legacy);
    await expect(uc.deleteSession({ sessionId: 42, authUser: AUTH })).rejects.toMatchObject({ statusCode: 403 });
    expect(leads.checkIfUserCanMutateLead).toHaveBeenCalledWith({ id: 200, authUser: AUTH });
    expect(legacy.deleteInProgressSession).not.toHaveBeenCalled();
  });

  it("editFields: 404s a forged sessionId before the legacy edit runs", async () => {
    const legacy = { editSessionFileds: vi.fn() };
    const uc = new ImageSessionUsecase(makeRepo(), makeLeads(), legacy);
    await expect(
      uc.editFields({ clientLeadId: 100, sessionId: 999, data: { name: "x" }, authUser: AUTH }),
    ).rejects.toMatchObject({ statusCode: 404, message: M.IMAGE_SESSION_NOT_FOUND });
    expect(legacy.editSessionFileds).not.toHaveBeenCalled();
  });

  it("modelIds: rejects a model OFF the allow-list (mass-read hardening)", async () => {
    const legacy = { getModelIds: vi.fn() };
    const uc = new ImageSessionUsecase(makeRepo(), makeLeads(), legacy);
    await expect(uc.modelIds({ model: "user", searchParams: {} })).rejects.toMatchObject({
      statusCode: 400,
      message: M.IMAGE_SESSION_MODEL_NOT_ALLOWED,
    });
    expect(legacy.getModelIds).not.toHaveBeenCalled();
  });

  it("modelIds: allows an allow-listed model and rejects a malformed `where` JSON", async () => {
    const legacy = { getModelIds: vi.fn().mockResolvedValue([{ id: 1 }]) };
    const uc = new ImageSessionUsecase(makeRepo(), makeLeads(), legacy);
    await uc.modelIds({ model: "designImage", searchParams: {} });
    expect(legacy.getModelIds).toHaveBeenCalledWith({ model: "designImage", searchParams: {} });
    await expect(uc.modelIds({ model: "designImage", searchParams: { where: "{not json" } })).rejects.toMatchObject({
      statusCode: 400,
    });
  });
});

// ════════════════════════════════════════════════════════════════════════════
//  PUBLIC CLIENT FLOW — token authoritative, no body-id override (IDOR safety)
// ════════════════════════════════════════════════════════════════════════════
describe("ClientImageSessionUsecase public flow — token is authoritative", () => {
  it("changeStatus keys the session by the TOKEN only (no client id override)", async () => {
    const changeSessionStatus = vi.fn().mockResolvedValue({ id: 1 });
    const uc = new ClientImageSessionUsecase({ changeSessionStatus });
    await uc.changeStatus({ token: "tok-abc", sessionStatus: "SELECTED_STYLE" });
    expect(changeSessionStatus).toHaveBeenCalledWith({ token: "tok-abc", sessionStatus: "SELECTED_STYLE" });
    expect(changeSessionStatus.mock.calls[0][0]).not.toHaveProperty("id");
  });

  it("changeStatus throws TOKEN_INVALID when no token", async () => {
    const uc = new ClientImageSessionUsecase({ changeSessionStatus: vi.fn() });
    await expect(uc.changeStatus({ token: "", sessionStatus: "INITIAL" })).rejects.toMatchObject({
      statusCode: 400,
      message: M.IMAGE_SESSION_TOKEN_INVALID,
    });
  });

  it("saveColor: OVERRIDES the body session id with the TOKEN-resolved id (the IDOR close)", async () => {
    // attacker passes session.id = 999 (someone else's) but a token that resolves to id 7.
    const getSessionByToken = vi.fn().mockResolvedValue({ id: 7, token: "tok", clientLeadId: 100 });
    const saveClientSelectedColor = vi.fn().mockResolvedValue({});
    const uc = new ClientImageSessionUsecase({ getSessionByToken, saveClientSelectedColor });
    await uc.saveColor({
      session: { id: 999, token: "tok" },
      selectedColor: { id: 3 },
      customColors: [],
      status: "SELECTED_COLOR_PATTERN",
    });
    const passed = saveClientSelectedColor.mock.calls[0][0];
    expect(passed.session.id).toBe(7); // overridden — NOT the attacker's 999
    expect(passed.session.clientLeadId).toBe(100);
  });

  it("saveColor: throws NOT_FOUND when the token resolves to nothing (no write)", async () => {
    const getSessionByToken = vi.fn().mockResolvedValue(null);
    const saveClientSelectedColor = vi.fn();
    const uc = new ClientImageSessionUsecase({ getSessionByToken, saveClientSelectedColor });
    await expect(
      uc.saveColor({ session: { id: 1, token: "bad" }, selectedColor: {}, status: "INITIAL" }),
    ).rejects.toMatchObject({ statusCode: 404 });
    expect(saveClientSelectedColor).not.toHaveBeenCalled();
  });

  it("generatePdf operates ONLY on the token's session (overrides id) → 🔒 frozen orchestrator", async () => {
    const getSessionByToken = vi.fn().mockResolvedValue({ id: 7, token: "tok-xyz", clientLeadId: 100 });
    const changeSessionStatus = vi.fn().mockResolvedValue({});
    const uploadPdfAndApproveSession = vi.fn().mockResolvedValue({});
    const uc = new ClientImageSessionUsecase({ getSessionByToken, changeSessionStatus, uploadPdfAndApproveSession });
    await uc.generatePdf({
      sessionData: { id: 999, token: "tok-xyz" }, // forged id 999
      signatureUrl: "/uploads/sig.png",
      sessionStatus: "PDF_GENERATED",
      lng: "ar",
    });
    // status keyed by the token; PDF orchestrator gets the TOKEN-resolved id (7), not 999.
    expect(changeSessionStatus).toHaveBeenCalledWith({
      token: "tok-xyz",
      sessionStatus: "PDF_GENERATED",
      extra: { signatureUrl: "/uploads/sig.png" },
    });
    const pdfArg = uploadPdfAndApproveSession.mock.calls[0][0];
    expect(pdfArg.sessionData.id).toBe(7);
    expect(pdfArg.sessionData.clientLeadId).toBe(100);
    expect(pdfArg.signatureUrl).toBe("/uploads/sig.png");
  });

  it("generatePdf maps a frozen-builder failure to a language-neutral code (no prose)", async () => {
    const uc = new ClientImageSessionUsecase({
      getSessionByToken: vi.fn().mockResolvedValue({ id: 7, token: "t", clientLeadId: 100 }),
      changeSessionStatus: vi.fn().mockResolvedValue({}),
      uploadPdfAndApproveSession: vi.fn().mockRejectedValue(new Error("boom")),
    });
    await expect(
      uc.generatePdf({ sessionData: { token: "t" }, signatureUrl: "/uploads/s.png", sessionStatus: "PDF_GENERATED" }),
    ).rejects.toMatchObject({ statusCode: 500, message: M.IMAGE_SESSION_PDF_GENERATION_FAILED });
  });

  it("deleteImage: REJECTS a missing/invalid token (404 NOT_FOUND) — frozen delete NOT called", async () => {
    const deleteImage = vi.fn();
    // invalid token → getSessionByToken resolves to nothing → #resolveByToken throws NOT_FOUND.
    const getSessionByToken = vi.fn().mockResolvedValue(null);
    const repo = { findSelectedImageOwnerSessionId: vi.fn() };
    const uc = new ClientImageSessionUsecase({ getSessionByToken, deleteImage }, repo);
    // missing token → TOKEN_INVALID (400) before any lookup.
    await expect(uc.deleteImage({ token: "", imageId: 5 })).rejects.toMatchObject({
      statusCode: 400,
      message: M.IMAGE_SESSION_TOKEN_INVALID,
    });
    // present-but-unknown token → NOT_FOUND (404).
    await expect(uc.deleteImage({ token: "bad", imageId: 5 })).rejects.toMatchObject({
      statusCode: 404,
      message: M.IMAGE_SESSION_NOT_FOUND,
    });
    expect(repo.findSelectedImageOwnerSessionId).not.toHaveBeenCalled();
    expect(deleteImage).not.toHaveBeenCalled();
  });

  it("deleteImage: REJECTS a cross-session imageId (the IDOR) — 404, frozen delete NOT called", async () => {
    // token resolves to session 7, but image 5 belongs to session 99 (a DIFFERENT client).
    const getSessionByToken = vi.fn().mockResolvedValue({ id: 7, token: "tok", clientLeadId: 100 });
    const deleteImage = vi.fn();
    const repo = { findSelectedImageOwnerSessionId: vi.fn().mockResolvedValue({ imageSessionId: 99 }) };
    const uc = new ClientImageSessionUsecase({ getSessionByToken, deleteImage }, repo);
    await expect(uc.deleteImage({ token: "tok", imageId: 5 })).rejects.toMatchObject({
      statusCode: 404,
      message: M.IMAGE_SESSION_NOT_FOUND,
    });
    expect(repo.findSelectedImageOwnerSessionId).toHaveBeenCalledWith({ imageId: 5 });
    expect(deleteImage).not.toHaveBeenCalled(); // the frozen wipe never runs cross-session
  });

  it("deleteImage: also 404s a non-existent imageId (no leak), frozen delete NOT called", async () => {
    const getSessionByToken = vi.fn().mockResolvedValue({ id: 7, token: "tok", clientLeadId: 100 });
    const deleteImage = vi.fn();
    const repo = { findSelectedImageOwnerSessionId: vi.fn().mockResolvedValue(null) };
    const uc = new ClientImageSessionUsecase({ getSessionByToken, deleteImage }, repo);
    await expect(uc.deleteImage({ token: "tok", imageId: 12345 })).rejects.toMatchObject({
      statusCode: 404,
      message: M.IMAGE_SESSION_NOT_FOUND,
    });
    expect(deleteImage).not.toHaveBeenCalled();
  });

  it("deleteImage: ALLOWS when the image belongs to the token's session → frozen deleteImage(imageId)", async () => {
    const getSessionByToken = vi.fn().mockResolvedValue({ id: 7, token: "tok", clientLeadId: 100 });
    const deleteImage = vi.fn().mockResolvedValue(true);
    const repo = { findSelectedImageOwnerSessionId: vi.fn().mockResolvedValue({ imageSessionId: 7 }) };
    const uc = new ClientImageSessionUsecase({ getSessionByToken, deleteImage }, repo);
    const out = await uc.deleteImage({ token: "tok", imageId: 5 });
    expect(out).toBe(true);
    // frozen service invoked UNCHANGED, with just the imageId (no extra args, no token leak).
    expect(deleteImage).toHaveBeenCalledWith({ imageId: 5 });
    expect(deleteImage).toHaveBeenCalledTimes(1);
  });

  it("deleteImage validation: requires a token and rejects injected sibling fields (.strict)", () => {
    expect(ClientImageSessionValidation.deleteImage.safeParse({}).success).toBe(false);
    expect(ClientImageSessionValidation.deleteImage.safeParse({ token: "" }).success).toBe(false);
    expect(ClientImageSessionValidation.deleteImage.safeParse({ token: "t" }).success).toBe(true);
    // an injected imageSessionId must NOT ride along.
    expect(ClientImageSessionValidation.deleteImage.safeParse({ token: "t", imageSessionId: 99 }).success).toBe(false);
  });

  it("modelData (extras /data): rejects a model OFF the allow-list", async () => {
    const getImageSesssionModel = vi.fn();
    const uc = new ClientImageSessionUsecase({ getImageSesssionModel });
    await expect(uc.modelData({ model: "user" })).rejects.toMatchObject({
      statusCode: 400,
      message: M.IMAGE_SESSION_MODEL_NOT_ALLOWED,
    });
    expect(getImageSesssionModel).not.toHaveBeenCalled();
  });
});

// ════════════════════════════════════════════════════════════════════════════
//  VALIDATION — mass-assignment + SSRF + status enum + language-neutral codes
// ════════════════════════════════════════════════════════════════════════════
describe("image-sessions validation — mass-assignment + SSRF + enum", () => {
  it("public changeStatus: rejects a client-supplied `id` (no session override)", () => {
    const r = ClientImageSessionValidation.changeStatus.safeParse({
      token: "t",
      sessionStatus: "INITIAL",
      id: 999, // attempt to target another session — must be rejected by .strict()
    });
    expect(r.success).toBe(false);
  });

  it("public changeStatus: REJECTS an invalid sessionStatus, ACCEPTS valid enum values", () => {
    expect(ClientImageSessionValidation.changeStatus.safeParse({ token: "t", sessionStatus: "SIGNING" }).success).toBe(
      false,
    );
    for (const s of ["INITIAL", "SELECTED_STYLE", "PDF_GENERATED", "SUBMITTED"]) {
      expect(ClientImageSessionValidation.changeStatus.safeParse({ token: "t", sessionStatus: s }).success, s).toBe(
        true,
      );
    }
  });

  it("public generatePdf: ACCEPTS a legitimate relative signature path (frozen chunk-upload output)", () => {
    for (const sig of ["/uploads/3f2a-9c11.png", "/uploads/sig.jpg", "/uploads/sig.jpeg", "/uploads/thumb/x.webp"]) {
      const r = ClientImageSessionValidation.generatePdf.safeParse({
        sessionData: { token: "tok" },
        signatureUrl: sig,
        sessionStatus: "PDF_GENERATED",
        lng: "ar",
      });
      expect(r.success, sig).toBe(true);
    }
  });

  it("public generatePdf: REJECTS SSRF / traversal signatureUrl payloads", () => {
    for (const sig of [
      ".attacker.com/x.png",
      "//evil.com/x.png",
      "http://evil/x.png",
      "https://evil.com/x.png",
      "data:image/png;base64,AAAA",
      "/../../etc/passwd",
      "/uploads/../../../etc/passwd.png",
      "/foo/@evil/x.png",
      "/uploads/x.svg",
      "/uploads/x.png?host=evil.com",
    ]) {
      const r = ClientImageSessionValidation.generatePdf.safeParse({
        sessionData: { token: "tok" },
        signatureUrl: sig,
        sessionStatus: "PDF_GENERATED",
        lng: "ar",
      });
      expect(r.success, sig).toBe(false);
    }
  });

  it("public generatePdf: requires sessionData.token", () => {
    const bad = ClientImageSessionValidation.generatePdf.safeParse({
      sessionData: {},
      signatureUrl: "/uploads/abc.png",
      sessionStatus: "PDF_GENERATED",
    });
    expect(bad.success).toBe(false);
  });

  it("saveColor: rejects an injected unknown top-level field (.strict)", () => {
    const r = ClientImageSessionValidation.saveColor.safeParse({
      session: { token: "t" },
      selectedColor: { id: 1 },
      status: "SELECTED_COLOR_PATTERN",
      adminOverride: true, // injected — must be rejected
    });
    expect(r.success).toBe(false);
  });

  it("session createSession: requires at least one space and a valid id list", () => {
    expect(ImageSessionValidation.createSession.safeParse({ spaces: [] }).success).toBe(false);
    expect(ImageSessionValidation.createSession.safeParse({ spaces: [1, 2] }).success).toBe(true);
    // injected field rejected
    expect(ImageSessionValidation.createSession.safeParse({ spaces: [1], createdById: 9 }).success).toBe(false);
  });

  it("session editSession: only known editable scalars pass (.strict mass-assignment guard)", () => {
    expect(ImageSessionValidation.editSession.safeParse({ name: "Living room" }).success).toBe(true);
    expect(ImageSessionValidation.editSession.safeParse({ clientLeadId: 999 }).success).toBe(false);
  });

  it("sessionParams: coerces numeric ids and rejects non-numeric", () => {
    expect(ImageSessionValidation.sessionParams.safeParse({ clientLeadId: "5", sessionId: "7" }).success).toBe(true);
    expect(ImageSessionValidation.sessionParams.safeParse({ clientLeadId: "abc", sessionId: "7" }).success).toBe(false);
  });

  it("language-neutral codes: every image-sessions code is SCREAMING_SNAKE and self-valued", () => {
    for (const [k, v] of Object.entries(M)) {
      expect(v).toBe(k);
      expect(k).toMatch(/^[A-Z0-9_]+$/);
    }
  });
});
