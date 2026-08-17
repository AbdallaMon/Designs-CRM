import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the audit infra seam so we can assert the semantic event without any DB.
vi.mock("../../../../../infra/audit/record-action.js", () => ({
  recordAction: vi.fn(),
  auditCtxFromReq: vi.fn(() => ({})),
}));

// The public-lead repo singleton is now used directly (no DI) — mock it.
vi.mock("../public-lead.repo.js", () => ({
  publicLeadRepository: {
    findClientByEmail: vi.fn(),
    createClient: vi.fn(),
    findTodaysLeadByEmail: vi.fn(),
    updateClientPhone: vi.fn(),
    createLead: vi.fn(),
    findLeadById: vi.fn(),
    findRegistrationStatusById: vi.fn(),
    updateLead: vi.fn(),
    completeRegistrationDraft: vi.fn(),
    findClientById: vi.fn(),
  },
  PublicLeadRepository: class {},
}));

// The lead code generator + file attach now come from the lead repo via a STATIC import
// (the former lazy `publicLeadDeps` adapters were removed) — mock that module.
vi.mock("../../../lead/lead.repo.js", () => ({
  leadRepository: {
    generateCodeForNewLead: vi.fn(),
    uploadFile: vi.fn(),
  },
}));

// The funnel notifications + cooperation email are statically imported too — mock them.
vi.mock("../../../../../infra/notifications/index.js", () => ({
  newLeadNotification: vi.fn(),
  newClientLeadNotification: vi.fn(),
  newLeadCompletedNotification: vi.fn(),
}));
vi.mock("../../../../../infra/mail/send-mail.js", () => ({
  sendEmail: vi.fn(),
}));

import { recordAction } from "../../../../../infra/audit/record-action.js";
import { publicLeadUsecase } from "../public-lead.usecase.js";
import { publicLeadRepository } from "../public-lead.repo.js";
import { leadRepository } from "../../../lead/lead.repo.js";
import { env } from "../../../../../config/env.js";
import { PublicLeadValidation } from "../public-lead.validation.js";

env.JWT_UPLOAD_SECRET = "public-lead-capability-test-secret";

// Restore the repo to a happy-path default (client exists, no lead today, lead persists).
function primeRepo(overrides = {}) {
  publicLeadRepository.findClientByEmail.mockResolvedValue({ id: 1, email: "a@b.com" });
  publicLeadRepository.findTodaysLeadByEmail.mockResolvedValue(null);
  publicLeadRepository.updateClientPhone.mockResolvedValue({ id: 1 });
  publicLeadRepository.createLead.mockResolvedValue({
    id: 42,
    status: "NEW",
    selectedCategory: "DESIGN",
    type: "APARTMENT",
    clientId: 1,
  });
  leadRepository.generateCodeForNewLead.mockResolvedValue("LEAD-CODE");
  Object.assign(publicLeadRepository, overrides);
}

describe("PublicLeadUsecase.createLead — LEAD_CREATED audit event", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    primeRepo();
  });

  it("records a LEAD_CREATED event once after the lead is persisted", async () => {
    const lead = await publicLeadUsecase.createLead(
      { email: "a@b.com", name: "N", phone: "+9715", category: "DESIGN", item: "APARTMENT" },
      { actorUserId: null, actorRole: null, ip: "1.2.3.4" },
    );

    expect(lead.id).toBe(42);
    expect(recordAction).toHaveBeenCalledTimes(1);
    expect(recordAction).toHaveBeenCalledWith(
      { actorUserId: null, actorRole: null, ip: "1.2.3.4" },
      expect.objectContaining({
        module: "lead",
        action: "LEAD_CREATED",
        entityType: "ClientLead",
        entityId: 42,
        clientLeadId: 42,
      }),
    );
  });
});

describe("PublicLeadUsecase register capability", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    primeRepo();
    publicLeadRepository.createLead.mockResolvedValue({
      id: 77,
      clientId: 1,
      status: "NEW",
      selectedCategory: "DESIGN",
      type: null,
    });
    publicLeadRepository.findLeadById.mockResolvedValue({
      id: 77,
      clientId: 1,
      description: "Didn't complete register yet",
    });
    publicLeadRepository.completeRegistrationDraft.mockResolvedValue({
      id: 77,
      clientId: 1,
      status: "NEW",
      selectedCategory: "DESIGN",
      type: "APARTMENT",
    });
    publicLeadRepository.findClientById.mockResolvedValue({ id: 1, email: "a@b.com" });
  });

  it("passes register -> complete with the matching draft token", async () => {
    const registered = await publicLeadUsecase.registerLead({
      email: "a@b.com",
      source: "https://booking.ahmadmobayed.com",
    });
    expect(registered).toMatchObject({ id: 77, capabilityToken: expect.any(String) });
    expect(publicLeadUsecase.authorizeCompleteRegister(77, registered.capabilityToken)).toEqual({
      purpose: "PUBLIC_REGISTER",
      leadId: 77,
    });

    const completed = await publicLeadUsecase.completeRegister(77, {
      category: "DESIGN",
      item: "APARTMENT",
      name: "Client",
      phone: "+971500000000",
    });
    expect(completed).toMatchObject({
      id: 77,
      clientId: 1,
      status: "NEW",
      selectedCategory: "DESIGN",
      type: "APARTMENT",
    });
    expect(publicLeadRepository.createLead).toHaveBeenCalledWith(
      expect.objectContaining({ source: "https://booking.ahmadmobayed.com" }),
    );
  });

  it("rejects a register token bound to another draft", async () => {
    const registered = await publicLeadUsecase.registerLead({ email: "a@b.com" });
    expect(() => publicLeadUsecase.authorizeCompleteRegister(78, registered.capabilityToken)).toThrow(
      expect.objectContaining({ code: "INVALID_TOKEN", statusCode: 401 }),
    );
  });

  it("rejects replay after an unpriced draft has already been completed", async () => {
    publicLeadRepository.findLeadById.mockResolvedValue({
      id: 77,
      clientId: 1,
      description: "DESIGN APARTMENT Dubai",
      price: null,
      averagePrice: null,
    });
    await expect(
      publicLeadUsecase.completeRegister(77, { category: "DESIGN", item: "APARTMENT" }),
    ).rejects.toMatchObject({ code: "CLIENT_LEAD_ALREADY_COMPLETED", statusCode: 400 });
  });

  it("returns only the capability-safe draft registration status", async () => {
    publicLeadRepository.findRegistrationStatusById.mockResolvedValueOnce({
      id: 77,
      description: "Didn't complete register yet",
      type: null,
    });
    await expect(publicLeadUsecase.getRegistrationStatus(77)).resolves.toEqual({
      id: 77,
      completed: false,
      item: null,
    });

    publicLeadRepository.findRegistrationStatusById.mockResolvedValueOnce({
      id: 77,
      description: "DESIGN APARTMENT OUTSIDE UAE",
      type: "APARTMENT",
    });
    await expect(publicLeadUsecase.getRegistrationStatus(77)).resolves.toEqual({
      id: 77,
      completed: true,
      item: "APARTMENT",
    });
  });

  it("does not disclose a missing registration", async () => {
    publicLeadRepository.findRegistrationStatusById.mockResolvedValue(null);
    await expect(publicLeadUsecase.getRegistrationStatus(999)).rejects.toMatchObject({
      code: "LEAD_NOT_FOUND",
      statusCode: 404,
    });
  });

  it("rejects the loser of a concurrent completion claim without side effects", async () => {
    publicLeadRepository.completeRegistrationDraft.mockResolvedValue(null);

    await expect(
      publicLeadUsecase.completeRegister(77, {
        category: "DESIGN",
        item: "APARTMENT",
      }),
    ).rejects.toMatchObject({
      code: "CLIENT_LEAD_ALREADY_COMPLETED",
      statusCode: 409,
    });
    expect(leadRepository.uploadFile).not.toHaveBeenCalled();
  });

  it("rejects an attachment URL bound to a different draft", async () => {
    await expect(
      publicLeadUsecase.completeRegister(77, {
        category: "DESIGN",
        item: "APARTMENT",
        url: "/uploads/public/public-lead/78/00000000-0000-4000-8000-000000000000-1.png",
      }),
    ).rejects.toMatchObject({ code: "LEAD_ACCESS_DENIED", statusCode: 403 });
  });

  it("requires register-first for attachments", () => {
    expect(
      PublicLeadValidation.newLead.safeParse({
        name: "Client",
        phone: "+971500000000",
        email: "client@example.com",
        url: "https://evil.example/payload.html",
      }).success,
    ).toBe(false);
    expect(
      PublicLeadValidation.completeRegister.safeParse({
        url: "/uploads/public/public-lead/77/00000000-0000-4000-8000-000000000000-1.png",
      }).success,
    ).toBe(true);
  });

  it("normalizes a lead source to its HTTP origin", () => {
    const parsed = PublicLeadValidation.registerLead.parse({
      email: "client@example.com",
      source: "https://booking.dreamstudiio.com/register?step=form",
    });
    expect(parsed.source).toBe("https://booking.dreamstudiio.com");
    expect(
      PublicLeadValidation.registerLead.safeParse({
        email: "client@example.com",
        source: "javascript:alert(1)",
      }).success,
    ).toBe(false);
  });

  it("validates email only while registering and strips it from draft completion", () => {
    expect(
      PublicLeadValidation.registerLead.safeParse({ email: "77" }).success,
    ).toBe(false);

    const completed = PublicLeadValidation.completeRegister.parse({
      email: "77",
      category: "DESIGN",
      item: "APARTMENT",
    });

    expect(completed).toEqual({ category: "DESIGN", item: "APARTMENT" });
  });
});
