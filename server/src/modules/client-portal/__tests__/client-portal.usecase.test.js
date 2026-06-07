import { describe, it, expect, vi } from "vitest";

import { AppError } from "../../../shared/errors/AppError.js";
import {
  clientPortalMessagesCodes,
  leadsMessagesCodes,
} from "@dms/shared";

import { PublicLeadUsecase } from "../../leads/client/public-lead/public-lead.usecase.js";
import { PublicLeadValidation as LV } from "../../leads/client/public-lead/public-lead.validation.js";
import { NotesUsecase } from "../notes/notes.usecase.js";
import { NotesValidation as NV } from "../notes/notes.validation.js";
import { PaymentsUsecase } from "../payments/payments.usecase.js";
import { PaymentsValidation as PV } from "../payments/payments.validation.js";
import { LanguagesUsecase } from "../languages/languages.usecase.js";
import { LanguagesValidation as LangV } from "../languages/languages.validation.js";

const CP = clientPortalMessagesCodes;
const LC = leadsMessagesCodes;

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

  const legacy = () => ({
    generateCodeForNewLead: vi.fn(async () => "0000001.1"),
    uploadFile: vi.fn(async () => ({ id: 9 })),
    newLeadNotification: vi.fn(async () => {}),
    newClientLeadNotification: vi.fn(async () => {}),
    newLeadCompletedNotification: vi.fn(async () => {}),
    sendEmail: vi.fn(async () => {}),
  });

  it("createLead: new client → creates lead with NEW status and a code (no prose)", async () => {
    const repo = makeRepo();
    const uc = new PublicLeadUsecase(repo, legacy());
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
    const uc = new PublicLeadUsecase(repo, legacy());
    await expect(
      uc.createLead({ name: "A", phone: "050", email: "a@x.com", category: "DESIGN", item: "X" }),
    ).rejects.toMatchObject({ message: LC.CLIENT_LEAD_ALREADY_TODAY, statusCode: 422 });
    expect(repo.createLead).not.toHaveBeenCalled();
  });

  it("completeRegister: missing lead → LEAD_NOT_FOUND code", async () => {
    const repo = makeRepo({ findLeadById: vi.fn(async () => null) });
    const uc = new PublicLeadUsecase(repo, legacy());
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
    const uc = new PublicLeadUsecase(repo, legacy());
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
  it("validation: idKey is constrained to the lead allow-list", () => {
    expect(NV.create.safeParse({ idKey: "clientLeadId", id: 1, content: "hi" }).success).toBe(true);
    expect(NV.create.safeParse({ idKey: "updateId", id: 1, content: "hi" }).success).toBe(true);
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
    const legacy = { getNotes: vi.fn(), addNote: vi.fn() };
    const uc = new NotesUsecase(legacy);
    await expect(uc.create({ idKey: "paymentId", id: 1, content: "x" })).rejects.toMatchObject({
      message: CP.NOTE_TARGET_INVALID,
      statusCode: 422,
    });
    expect(legacy.addNote).not.toHaveBeenCalled();
  });

  it("usecase: forces client:true (author=ADMIN) and never forwards a userId", async () => {
    const legacy = {
      getNotes: vi.fn(),
      addNote: vi.fn(async () => ({ data: { id: 1 }, message: "prose" })),
    };
    const uc = new NotesUsecase(legacy);
    const out = await uc.create({ idKey: "clientLeadId", id: 7, content: "hi" });
    expect(legacy.addNote).toHaveBeenCalledWith(
      expect.objectContaining({ idKey: "clientLeadId", id: 7, client: true }),
    );
    expect(legacy.addNote.mock.calls[0][0]).not.toHaveProperty("userId");
    expect(out).toEqual({ id: 1 }); // prose dropped
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

  function makeRepo() {
    return {
      getLeadWithClient: vi.fn(async () => ({
        id: 5,
        client: { id: 1, name: "A", email: "a@x.com" },
      })),
      getLeadPaymentState: vi.fn(async () => ({
        id: 5,
        paymentStatus: "PENDING",
        client: { name: "A", email: "a@x.com" },
      })),
      markFullyPaid: vi.fn(async () => ({})),
      saveStripeMetadata: vi.fn(async () => ({})),
    };
  }

  const billingLegacy = {
    first: (...a) => a.find((v) => v !== undefined && v !== null && `${v}`.trim() !== "") ?? "",
    asKV: (o) => Object.entries(o).map(([key, value]) => ({ key, value: value ?? "" })),
    sendPaymentReminderEmail: vi.fn(async () => {}),
    sendPaymentSuccessEmail: vi.fn(async () => {}),
    leadPaymentSuccessed: vi.fn(async () => {}),
  };

  it("payment-status: paid session whose metadata.clientLeadId MISMATCHES the supplied id → 403 (IDOR close)", async () => {
    const repo = makeRepo();
    const stripe = {
      createCheckoutSession: vi.fn(),
      retrieveCheckoutSession: vi.fn(async () => ({
        id: "cs_1",
        payment_status: "paid",
        metadata: { clientLeadId: "999" }, // session really belongs to lead 999
      })),
    };
    const uc = new PaymentsUsecase(repo, stripe, billingLegacy);
    await expect(
      uc.paymentStatus({ sessionId: "cs_1", clientLeadId: 5, lng: "en" }), // caller claims lead 5
    ).rejects.toMatchObject({ message: CP.PAYMENT_NOT_ALLOWED, statusCode: 403 });
    expect(repo.markFullyPaid).not.toHaveBeenCalled();
  });

  it("payment-status: paid + metadata MATCHES → marks the metadata lead paid", async () => {
    const repo = makeRepo();
    const stripe = {
      createCheckoutSession: vi.fn(),
      retrieveCheckoutSession: vi.fn(async () => ({
        id: "cs_1",
        payment_status: "paid",
        metadata: { clientLeadId: "5" },
      })),
    };
    const uc = new PaymentsUsecase(repo, stripe, billingLegacy);
    const out = await uc.paymentStatus({ sessionId: "cs_1", clientLeadId: 5, lng: "en" });
    expect(out.paid).toBe(true);
    expect(repo.markFullyPaid).toHaveBeenCalledWith("5", "cs_1");
  });

  it("payment-status: unpaid session → { paid:false }, no DB write", async () => {
    const repo = makeRepo();
    const stripe = {
      createCheckoutSession: vi.fn(),
      retrieveCheckoutSession: vi.fn(async () => ({ id: "cs_1", payment_status: "unpaid" })),
    };
    const uc = new PaymentsUsecase(repo, stripe, billingLegacy);
    const out = await uc.paymentStatus({ sessionId: "cs_1", clientLeadId: 5 });
    expect(out.paid).toBe(false);
    expect(repo.markFullyPaid).not.toHaveBeenCalled();
  });

  it("backfill: wrong secret → 403", () => {
    const uc = new PaymentsUsecase(makeRepo(), {}, billingLegacy);
    expect(() => uc.backfill({ pass: "wrong" })).toThrow(AppError);
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
    const legacy = { getLanguages: vi.fn(async () => [{ id: 1 }]) };
    const uc = new LanguagesUsecase(legacy);
    const out = await uc.list({ notArchived: true });
    expect(legacy.getLanguages).toHaveBeenCalledWith({ notArchived: true });
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
