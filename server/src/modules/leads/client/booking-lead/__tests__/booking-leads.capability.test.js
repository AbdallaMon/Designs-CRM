import { beforeEach, describe, expect, it, vi } from "vitest";
import jwt from "jsonwebtoken";

vi.mock("../booking-leads.repo.js", () => ({
  bookingLeadsRepository: {
    createDraft: vi.fn(),
    findById: vi.fn(),
    updateStep: vi.fn(),
    submit: vi.fn(),
  },
}));
vi.mock("../booking-leads.notification.js", () => ({
  notifyLeadCreated: vi.fn(),
  notifyLeadSubmitted: vi.fn(),
}));
vi.mock("../../../../../infra/mail/send-mail.js", () => ({ sendEmail: vi.fn() }));

import { env } from "../../../../../config/env.js";
import { bookingLeadsRepository } from "../booking-leads.repo.js";
import { bookingLeadsUsecase } from "../booking-leads.usecase.js";
import {
  issuePublicFunnelCapability,
  PUBLIC_FUNNEL_PURPOSES,
} from "../../../../../infra/upload/public-funnel-capability.js";

env.JWT_UPLOAD_SECRET = "booking-capability-test-secret";

function draft(id = 41) {
  return {
    id,
    bookingRequestStatus: "IN_PROGRESS",
    bookingSubmittedAt: null,
    client: { id: 7, name: "Client", phone: "+971500000000", email: "draft@draft.local" },
  };
}

describe("booking lead capability scope", () => {
  let current;

  beforeEach(() => {
    vi.clearAllMocks();
    current = draft();
    bookingLeadsRepository.createDraft.mockImplementation(async () => current);
    bookingLeadsRepository.findById.mockImplementation(async (id) =>
      Number(id) === current.id ? current : null,
    );
    bookingLeadsRepository.updateStep.mockImplementation(async ({ leadData, clientData }) => {
      current = {
        ...current,
        ...leadData,
        client: { ...current.client, ...clientData },
      };
      return current;
    });
    bookingLeadsRepository.submit.mockImplementation(async ({ leadData, clientData }) => {
      current = {
        ...current,
        ...leadData,
        client: { ...current.client, ...clientData },
      };
      return current;
    });
  });

  it("passes a valid create -> update -> submit flow", async () => {
    const created = await bookingLeadsUsecase.createBookingLead({
      name: "Client",
      phone: "+971500000000",
      source: "https://booking.ahmadmobayed.com",
    });
    expect(created).toMatchObject({ id: 41, capabilityToken: expect.any(String) });
    expect(bookingLeadsRepository.createDraft).toHaveBeenCalledWith(
      expect.objectContaining({ source: "https://booking.ahmadmobayed.com" }),
    );

    expect(bookingLeadsUsecase.authorizeBookingLead(41, created.capabilityToken)).toEqual({
      purpose: PUBLIC_FUNNEL_PURPOSES.BOOKING_LEAD,
      leadId: 41,
    });
    await bookingLeadsUsecase.updateBookingLeadStep(41, { field: "location", value: "Dubai" });
    bookingLeadsUsecase.authorizeBookingLead(41, created.capabilityToken);
    const submitted = await bookingLeadsUsecase.submitBookingLead(41, {
      location: "Dubai",
      projectType: "Villa",
      projectStage: "Planning",
      previousWork: "No",
      hasArchitecturalPlan: "Yes",
      serviceType: "Design",
      decisionMaker: "Self",
      name: "Client",
      phone: "+971500000000",
      email: "client@example.com",
      contactAgreement: true,
      contactInitialPriceAgreement: true,
    });
    expect(submitted.status).toBe("SUBMITTED");
  });

  it("returns the coded conflict when another request wins the submit claim", async () => {
    bookingLeadsRepository.submit.mockResolvedValue(null);

    await expect(
      bookingLeadsUsecase.submitBookingLead(41, {
        location: "Dubai",
        projectType: "Villa",
        projectStage: "Planning",
        previousWork: "No",
        hasArchitecturalPlan: "Yes",
        serviceType: "Design",
        decisionMaker: "Self",
        name: "Client",
        phone: "+971500000000",
        email: "client@example.com",
        contactAgreement: true,
        contactInitialPriceAgreement: true,
      }),
    ).rejects.toMatchObject({
      code: "BOOKING_LEAD_ALREADY_SUBMITTED",
      statusCode: 409,
    });
  });

  it("rejects a token bound to another lead", () => {
    const wrong = issuePublicFunnelCapability({
      purpose: PUBLIC_FUNNEL_PURPOSES.BOOKING_LEAD,
      leadId: 42,
    });
    expect(() => bookingLeadsUsecase.authorizeBookingLead(41, wrong.token)).toThrow(
      expect.objectContaining({ code: "INVALID_TOKEN", statusCode: 401 }),
    );
  });

  it.each([
    ["missing", null],
    [
      "wrong purpose",
      issuePublicFunnelCapability({
        purpose: PUBLIC_FUNNEL_PURPOSES.PUBLIC_REGISTER,
        leadId: 41,
      }).token,
    ],
    [
      "expired",
      jwt.sign(
        { purpose: PUBLIC_FUNNEL_PURPOSES.BOOKING_LEAD, subject: "41" },
        env.JWT_UPLOAD_SECRET,
        {
          audience: "public-upload",
          issuer: "dream-studio-api",
          expiresIn: -1,
        },
      ),
    ],
  ])("rejects a %s token", (_label, token) => {
    expect(() => bookingLeadsUsecase.authorizeBookingLead(41, token)).toThrow(
      expect.objectContaining({ code: "INVALID_TOKEN", statusCode: 401 }),
    );
  });
});
