import { describe, it, expect, vi, beforeEach } from "vitest";

import { AppError } from "../../../shared/errors/AppError.js";
import {
  clientPortalMessagesCodes,
  leadsMessagesCodes,
} from "@dms/shared";

// ── Module mocks for the DI-free notes/payments/languages usecases ───────────
// These now call directly-imported singletons + lazy adapters (no constructor
// injection). Mock those seams so the tests drive them like the old injection.
vi.mock("../../notes/note.usecase.js", () => ({
  getNotes: vi.fn(),
  addNote: vi.fn(),
}));
vi.mock("../notes/notes.repo.js", () => ({
  clientNotesRepository: {
    findSessionIdByToken: vi.fn(),
    findSelectedImageOwnerSessionId: vi.fn(),
  },
}));
vi.mock("../payments/payments.stripe.js", () => ({
  createCheckoutSession: vi.fn(),
  retrieveCheckoutSession: vi.fn(),
  listCheckoutSessions: vi.fn(),
  getLeadIdFromUrl: vi.fn(),
  normalizeFromSession: vi.fn(),
  constructWebhookEvent: vi.fn(),
  isFulfillableCheckoutSession: vi.fn(
    (session) =>
      session?.mode === "payment" &&
      session?.status === "complete" &&
      ["paid", "no_payment_required"].includes(session.payment_status),
  ),
}));
vi.mock("../payments/payments.repo.js", () => ({
  paymentsRepository: {
    getLeadWithClient: vi.fn(),
    getLeadPaymentState: vi.fn(),
    saveStripeMetadata: vi.fn(),
    bindCheckoutSession: vi.fn(),
    fulfillCheckoutSession: vi.fn(),
    findLeadById: vi.fn(),
  },
}));
vi.mock("../../../infra/notifications/index.js", () => ({
  sendPaymentReminderEmail: vi.fn(),
  sendPaymentSuccessEmail: vi.fn(),
  leadPaymentSuccessed: vi.fn(),
  // public-lead funnel notifications (now statically imported by public-lead.usecase)
  newLeadNotification: vi.fn(),
  newClientLeadNotification: vi.fn(),
  newLeadCompletedNotification: vi.fn(),
}));
vi.mock("../../image-sessions/services/languages.js", () => ({
  getLanguages: vi.fn(),
}));
// The public-lead funnel now reaches the lead code generator + file attach via a STATIC
// import from the lead repo (the former lazy `publicLeadDeps` adapters were removed) — and
// the cooperation email via the mail infra. Mock both so the funnel side effects are inert.
vi.mock("../../leads/lead/lead.repo.js", () => ({
  leadRepository: {
    generateCodeForNewLead: vi.fn(),
    uploadFile: vi.fn(),
  },
}));
vi.mock("../../../infra/mail/send-mail.js", () => ({
  sendEmail: vi.fn(),
}));

import { publicLeadUsecase } from "../../leads/client/public-lead/public-lead.usecase.js";
import { publicLeadRepository } from "../../leads/client/public-lead/public-lead.repo.js";
import { leadRepository } from "../../leads/lead/lead.repo.js";
import { PublicLeadValidation as LV } from "../../leads/client/public-lead/public-lead.validation.js";
import { notesUsecase } from "../notes/notes.usecase.js";
import { NotesValidation as NV } from "../notes/notes.validation.js";
import { paymentsUsecase } from "../payments/payments.usecase.js";
import { PaymentsValidation as PV } from "../payments/payments.validation.js";
import { languagesUsecase } from "../languages/languages.usecase.js";
import { LanguagesValidation as LangV } from "../languages/languages.validation.js";

import { addNote as mockAddNote } from "../../notes/note.usecase.js";
import { clientNotesRepository } from "../notes/notes.repo.js";
import { retrieveCheckoutSession } from "../payments/payments.stripe.js";
import { paymentsRepository } from "../payments/payments.repo.js";
import { getLanguages as mockGetLanguages } from "../../image-sessions/services/languages.js";

const CP = clientPortalMessagesCodes;
const LC = leadsMessagesCodes;

beforeEach(() => {
  vi.clearAllMocks();
});

// ════════════════════════════════════════════════════════════════════════════
//  PUBLIC LEAD FUNNEL — distinct from booking-leads; public; prose→codes
// ════════════════════════════════════════════════════════════════════════════
describe("public lead funnel (legacy /client/leads.js)", () => {
  function makeRepo(overrides = {}) {
    return {
      findClientByEmail: vi.fn(async () => null),
      createClient: vi.fn(async ({ name, phone, email }) => ({
        id: 1,
        name,
        phone,
        email,
      })),
      findTodaysLeadByEmail: vi.fn(async () => null),
      updateClientPhone: vi.fn(async () => ({ id: 1 })),
      createLead: vi.fn(async (data) => ({ id: 50, ...data })),
      findLeadById: vi.fn(async () => null),
      updateLead: vi.fn(async (id, data) => ({ id: Number(id), ...data })),
      findClientById: vi.fn(async () => ({ id: 1 })),
      ...overrides,
    };
  }

  // Prime the statically-imported lead-repo adapters the funnel now calls directly. The
  // notification + mail seams are already inert vi.fn()s from their module mocks above.
  function primeLegacy() {
    leadRepository.generateCodeForNewLead.mockResolvedValue("0000001.1");
    leadRepository.uploadFile.mockResolvedValue({ id: 9 });
  }

  it("createLead: new client → creates lead with NEW status and a code (no prose)", async () => {
    const repo = makeRepo();
    // DI removed from PublicLeadUsecase — assign the mocks onto the singletons it now
    // references directly, then use the singleton usecase.
    Object.assign(publicLeadRepository, repo);
    primeLegacy();
    const uc = publicLeadUsecase;
    const lead = await uc.createLead({
      name: "A",
      phone: "050 111",
      email: "a@x.com",
      category: "DESIGN",
      item: "VILLA",
      emirate: "DUBAI",
    });
    expect(repo.createClient).toHaveBeenCalled();
    expect(lead.status).toBe("NEW");
    expect(lead.code).toBe("0000001.1");
  });

  it("createLead: existing client with a lead today → blocked with a CODE, not Arabic prose", async () => {
    const repo = makeRepo({
      findClientByEmail: vi.fn(async () => ({ id: 1, email: "a@x.com" })),
      findTodaysLeadByEmail: vi.fn(async () => ({ id: 7 })),
    });
    // DI removed from PublicLeadUsecase — assign the mocks onto the singletons it now
    // references directly, then use the singleton usecase.
    Object.assign(publicLeadRepository, repo);
    primeLegacy();
    const uc = publicLeadUsecase;
    await expect(
      uc.createLead({ name: "A", phone: "050", email: "a@x.com", category: "DESIGN", item: "X" }),
    ).rejects.toMatchObject({ message: LC.CLIENT_LEAD_ALREADY_TODAY, statusCode: 422 });
    expect(repo.createLead).not.toHaveBeenCalled();
  });

  it("completeRegister: missing lead → LEAD_NOT_FOUND code", async () => {
    const repo = makeRepo({ findLeadById: vi.fn(async () => null) });
    // DI removed from PublicLeadUsecase — assign the mocks onto the singletons it now
    // references directly, then use the singleton usecase.
    Object.assign(publicLeadRepository, repo);
    primeLegacy();
    const uc = publicLeadUsecase;
    await expect(uc.completeRegister(99, { category: "DESIGN", item: "X" })).rejects.toMatchObject(
      { message: LC.LEAD_NOT_FOUND, statusCode: 404 },
    );
  });

  it("completeRegister: already-completed (priced, not draft) → ALREADY_COMPLETED code", async () => {
    const repo = makeRepo({
      findLeadById: vi.fn(async () => ({
        id: 5,
        clientId: 1,
        description: "real desc",
        price: "x",
        averagePrice: 100,
      })),
    });
    // DI removed from PublicLeadUsecase — assign the mocks onto the singletons it now
    // references directly, then use the singleton usecase.
    Object.assign(publicLeadRepository, repo);
    primeLegacy();
    const uc = publicLeadUsecase;
    await expect(uc.completeRegister(5, { category: "DESIGN", item: "X" })).rejects.toMatchObject({
      message: LC.CLIENT_LEAD_ALREADY_COMPLETED,
      statusCode: 400,
    });
  });

  it("validation drops unknown keys (mass-assignment): no rogue column reaches the lead", () => {
    const parsed = LV.newLead.parse({
      name: "A",
      phone: "050",
      email: "a@x.com",
      status: "FINALIZED", // rogue
      averagePrice: 999999, // rogue
      clientId: 7, // rogue
    });
    expect(parsed).not.toHaveProperty("status");
    expect(parsed).not.toHaveProperty("averagePrice");
    expect(parsed).not.toHaveProperty("clientId");
  });
});

// ════════════════════════════════════════════════════════════════════════════
//  NOTES — dynamic-key allow-list (IDOR / mass-assignment close)
// ════════════════════════════════════════════════════════════════════════════
describe("client notes (legacy /client/notes.js)", () => {
  it("validation: idKey is constrained to the lead/image-session allow-list", () => {
    expect(NV.create.safeParse({ idKey: "clientLeadId", id: 1, content: "hi" }).success).toBe(true);
    expect(NV.create.safeParse({ idKey: "updateId", id: 1, content: "hi" }).success).toBe(true);
    // image-session targets (token object-scope enforced in the usecase)
    expect(NV.create.safeParse({ idKey: "imageSessionId", id: 1, content: "hi" }).success).toBe(true);
    expect(NV.create.safeParse({ idKey: "selectedImageId", id: 1, content: "hi" }).success).toBe(true);
    // forbidden targets a client must never address
    expect(NV.create.safeParse({ idKey: "paymentId", id: 1, content: "hi" }).success).toBe(false);
    expect(NV.create.safeParse({ idKey: "userId", id: 1, content: "hi" }).success).toBe(false);
    expect(NV.create.safeParse({ idKey: "contractId", id: 1, content: "hi" }).success).toBe(false);
  });

  it("validation: body is strict (rejects extra fields like userId)", () => {
    const r = NV.create.safeParse({ idKey: "clientLeadId", id: 1, content: "hi", userId: 3 });
    expect(r.success).toBe(false);
  });

  it("usecase: rejects a non-allow-listed idKey even if it slips past validation", async () => {
    await expect(notesUsecase.createNote({ idKey: "paymentId", id: 1, content: "x" })).rejects.toMatchObject({
      message: CP.NOTE_TARGET_INVALID,
      statusCode: 422,
    });
    expect(mockAddNote).not.toHaveBeenCalled();
  });

  it("usecase: forces client:true (author=ADMIN) and never forwards a userId", async () => {
    mockAddNote.mockResolvedValue({ data: { id: 1 }, message: "prose" });
    const out = await notesUsecase.createNote({ idKey: "clientLeadId", id: 7, content: "hi" });
    expect(mockAddNote).toHaveBeenCalledWith(
      expect.objectContaining({ idKey: "clientLeadId", id: 7, client: true }),
    );
    expect(mockAddNote.mock.calls[0][0]).not.toHaveProperty("userId");
    expect(out).toEqual({ id: 1 }); // prose dropped
  });

  // ── token object-scope (image-session note targets) ──────────────────────────────────
  it("usecase: selectedImageId requires a token whose session OWNS the image", async () => {
    mockAddNote.mockResolvedValue({ data: { id: 9 } });
    clientNotesRepository.findSessionIdByToken.mockResolvedValue({ id: 10 });
    clientNotesRepository.findSelectedImageOwnerSessionId.mockResolvedValue({ imageSessionId: 10 });
    const out = await notesUsecase.createNote({ idKey: "selectedImageId", id: 3, content: "hi", token: "t" });
    expect(clientNotesRepository.findSessionIdByToken).toHaveBeenCalledWith("t");
    expect(mockAddNote).toHaveBeenCalledWith(
      expect.objectContaining({ idKey: "selectedImageId", id: 3, client: true }),
    );
    expect(out).toEqual({ id: 9 });
  });

  it("usecase: image-session target WITHOUT a token → 403 (IDOR close)", async () => {
    clientNotesRepository.findSessionIdByToken.mockResolvedValue(null); // no token → no session
    await expect(
      notesUsecase.createNote({ idKey: "selectedImageId", id: 3, content: "x" }),
    ).rejects.toMatchObject({ message: CP.NOTE_NOT_AUTHORIZED, statusCode: 403 });
    expect(mockAddNote).not.toHaveBeenCalled();
  });

  it("usecase: selectedImageId owned by a DIFFERENT session → 403", async () => {
    clientNotesRepository.findSessionIdByToken.mockResolvedValue({ id: 10 });
    clientNotesRepository.findSelectedImageOwnerSessionId.mockResolvedValue({ imageSessionId: 99 });
    await expect(
      notesUsecase.createNote({ idKey: "selectedImageId", id: 3, content: "x", token: "t" }),
    ).rejects.toMatchObject({ message: CP.NOTE_NOT_AUTHORIZED, statusCode: 403 });
    expect(mockAddNote).not.toHaveBeenCalled();
  });

  it("usecase: imageSessionId must equal the token's own session id", async () => {
    mockAddNote.mockResolvedValue({ data: {} });
    clientNotesRepository.findSessionIdByToken.mockResolvedValue({ id: 5 });
    // mismatch → 403
    await expect(
      notesUsecase.createNote({ idKey: "imageSessionId", id: 6, content: "x", token: "t" }),
    ).rejects.toMatchObject({ message: CP.NOTE_NOT_AUTHORIZED, statusCode: 403 });
    // match → allowed
    await notesUsecase.createNote({ idKey: "imageSessionId", id: 5, content: "x", token: "t" });
    expect(mockAddNote).toHaveBeenCalledTimes(1);
  });

  it("usecase: lead/update targets stay public (no token required)", async () => {
    mockAddNote.mockResolvedValue({ data: { id: 1 } });
    await notesUsecase.createNote({ idKey: "clientLeadId", id: 7, content: "hi" });
    expect(clientNotesRepository.findSessionIdByToken).not.toHaveBeenCalled();
    expect(mockAddNote).toHaveBeenCalled();
  });
});

// ════════════════════════════════════════════════════════════════════════════
//  PAYMENTS — amount validation + IDOR close via session metadata
// ════════════════════════════════════════════════════════════════════════════
describe("client payments (legacy /client/payments.js)", () => {
  it("validation: pay requires a positive clientLeadId and is strict", () => {
    expect(PV.pay.safeParse({ clientLeadId: 5 }).success).toBe(true);
    expect(PV.pay.safeParse({ clientLeadId: -1 }).success).toBe(false);
    expect(PV.pay.safeParse({ clientLeadId: 0 }).success).toBe(false);
    // strict: a client-supplied amount/status is rejected outright
    expect(PV.pay.safeParse({ clientLeadId: 5, amount: 1000 }).success).toBe(false);
    expect(PV.pay.safeParse({ clientLeadId: 5, paymentStatus: "FULLY_PAID" }).success).toBe(false);
  });

  function seedPaymentsRepo() {
    paymentsRepository.getLeadWithClient.mockResolvedValue({
      id: 5,
      client: { id: 1, name: "A", email: "a@x.com" },
    });
    paymentsRepository.getLeadPaymentState.mockResolvedValue({
      id: 5,
      paymentStatus: "PENDING",
      client: { name: "A", email: "a@x.com" },
    });
    paymentsRepository.saveStripeMetadata.mockResolvedValue({});
    paymentsRepository.fulfillCheckoutSession.mockResolvedValue({
      state: "fulfilled",
      lead: {
        id: 5,
        paymentStatus: "PENDING",
        paymentSessionId: "cs_1",
        client: { name: "A", email: "a@x.com" },
      },
    });
  }

  it("payment-status: paid session whose metadata.clientLeadId MISMATCHES the supplied id → 403 (IDOR close)", async () => {
    seedPaymentsRepo();
    retrieveCheckoutSession.mockResolvedValue({
      id: "cs_1",
      mode: "payment",
      status: "complete",
      payment_status: "paid",
      metadata: { clientLeadId: "999" }, // session really belongs to lead 999
    });
    await expect(
      paymentsUsecase.paymentStatus({ sessionId: "cs_1", clientLeadId: 5, lng: "en" }), // caller claims lead 5
    ).rejects.toMatchObject({ message: CP.PAYMENT_NOT_ALLOWED, statusCode: 403 });
    expect(paymentsRepository.fulfillCheckoutSession).not.toHaveBeenCalled();
  });

  it("payment-status: paid + metadata MATCHES → marks the metadata lead paid", async () => {
    seedPaymentsRepo();
    retrieveCheckoutSession.mockResolvedValue({
      id: "cs_1",
      mode: "payment",
      status: "complete",
      payment_status: "paid",
      metadata: { clientLeadId: "5" },
    });
    const out = await paymentsUsecase.paymentStatus({ sessionId: "cs_1", clientLeadId: 5, lng: "en" });
    expect(out.paid).toBe(true);
    expect(paymentsRepository.fulfillCheckoutSession).toHaveBeenCalledWith(
      expect.objectContaining({ clientLeadId: "5", sessionId: "cs_1" }),
    );
  });

  it("payment-status: unpaid session → { paid:false }, no DB write", async () => {
    seedPaymentsRepo();
    retrieveCheckoutSession.mockResolvedValue({
      id: "cs_1",
      mode: "payment",
      status: "open",
      payment_status: "unpaid",
      metadata: { clientLeadId: "5" },
    });
    const out = await paymentsUsecase.paymentStatus({ sessionId: "cs_1", clientLeadId: 5 });
    expect(out.paid).toBe(false);
    expect(paymentsRepository.fulfillCheckoutSession).not.toHaveBeenCalled();
  });

  it("backfill: wrong secret → 403", () => {
    expect(() => paymentsUsecase.backfill({ pass: "wrong" })).toThrow(AppError);
  });
});

// ════════════════════════════════════════════════════════════════════════════
//  LANGUAGES — public lookup; "true" string → boolean
// ════════════════════════════════════════════════════════════════════════════
describe("client languages (legacy /client/languages.js)", () => {
  it("validation coerces notArchived=true to a boolean", () => {
    expect(LangV.listQuery.parse({ notArchived: "true" })).toEqual({ notArchived: true });
    expect(LangV.listQuery.parse({ notArchived: "false" })).toEqual({ notArchived: false });
    expect(LangV.listQuery.parse({})).toEqual({ notArchived: false });
  });

  it("usecase passes notArchived through to the frozen getLanguages", async () => {
    mockGetLanguages.mockResolvedValue([{ id: 1 }]);
    const out = await languagesUsecase.listLanguages({ notArchived: true });
    expect(mockGetLanguages).toHaveBeenCalledWith({ notArchived: true });
    expect(out).toEqual([{ id: 1 }]);
  });
});

// ════════════════════════════════════════════════════════════════════════════
//  MESSAGE CODES — language-neutral (no Arabic/English prose leaked)
// ════════════════════════════════════════════════════════════════════════════
describe("client-portal message codes are language-neutral", () => {
  it("every code value === its key and is SCREAMING_SNAKE_CASE", () => {
    for (const [k, v] of Object.entries(CP)) {
      expect(v).toBe(k);
      expect(k).toMatch(/^[A-Z0-9_]+$/);
    }
  });
});
