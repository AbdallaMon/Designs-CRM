// Next-touch enforcement matrix (spec 2026-07-15 §5.2, "required with escape"):
// closing (DONE/MISSED) the LAST future touchpoint on an ACTIVE lead must either
// schedule the next touch or record an explicit no-follow-up reason — else 422
// NEXT_TOUCH_REQUIRED. Non-active leads / non-last touches are exempt.
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../lead.repo.js", () => ({
  leadRepository: {
    findCallReminderOwner: vi.fn(),
    findMeetingReminderOwner: vi.fn(),
    findLeadStatus: vi.fn(),
    hasOtherFutureTouch: vi.fn(),
    updateCallReminderStatusRecord: vi.fn(),
    updateMeetingReminderStatusRecord: vi.fn(),
    touchLead: vi.fn(),
    createNoteRecord: vi.fn(),
    findNoteWithUser: vi.fn(),
    createCallReminderRecord: vi.fn(),
    findLatestCallReminders: vi.fn(),
  },
  LeadRepository: class {},
}));
vi.mock("../../../../infra/telegram/telegram-functions.js", () => ({
  getChannelEntitiyByTeleRecordAndLeadId: vi.fn().mockResolvedValue(null),
  uploadAnAttachment: vi.fn(),
  uploadANote: vi.fn(),
}));
vi.mock("../../../../infra/notifications/index.js", () => ({
  newCallNotification: vi.fn(),
  newFileUploaded: vi.fn(),
  newNoteNotification: vi.fn(),
  newPriceOffer: vi.fn(),
  updateCallNotification: vi.fn(),
  updateMettingNotification: vi.fn(),
}));

import { leadRepository } from "../lead.repo.js";
import {
  updateCallReminderStatus,
  updateMeetingReminderStatus,
} from "../lead.sub-resources.usecase.js";

const OWNER = { id: 7, role: "STAFF" };
const REMINDER = { id: 1, userId: 7, clientLeadId: 5, user: { id: 7 } };
const UPDATED = { id: 1, time: new Date(), status: "DONE", clientLeadId: 5, userId: 7 };

function seed({ leadStatus = "IN_PROGRESS", hasFuture = false } = {}) {
  leadRepository.findCallReminderOwner.mockResolvedValue(REMINDER);
  leadRepository.findMeetingReminderOwner.mockResolvedValue(REMINDER);
  leadRepository.findLeadStatus.mockResolvedValue({ id: 5, status: leadStatus });
  leadRepository.hasOtherFutureTouch.mockResolvedValue(hasFuture);
  leadRepository.updateCallReminderStatusRecord.mockResolvedValue(UPDATED);
  leadRepository.updateMeetingReminderStatusRecord.mockResolvedValue({
    ...UPDATED,
    meetingResult: "x",
  });
  leadRepository.touchLead.mockResolvedValue(undefined);
  leadRepository.createNoteRecord.mockResolvedValue({ id: 9, user: { id: 7 } });
  leadRepository.findNoteWithUser.mockResolvedValue({ id: 9, content: "n", user: { id: 7 } });
  leadRepository.createCallReminderRecord.mockResolvedValue({ id: 33, clientLeadId: 5, time: new Date() });
  leadRepository.findLatestCallReminders.mockResolvedValue([]);
}

beforeEach(() => {
  vi.clearAllMocks();
  seed();
});

describe("updateCallReminderStatus — next-touch enforcement", () => {
  it("DONE on the last touchpoint of an active lead with no plan → 422 NEXT_TOUCH_REQUIRED (no write)", async () => {
    await expect(
      updateCallReminderStatus({ reminderId: 1, currentUser: OWNER, status: "DONE", callResult: "ok" }),
    ).rejects.toMatchObject({ statusCode: 422, message: "NEXT_TOUCH_REQUIRED" });
    expect(leadRepository.updateCallReminderStatusRecord).not.toHaveBeenCalled();
  });

  it("MISSED behaves like DONE", async () => {
    await expect(
      updateCallReminderStatus({ reminderId: 1, currentUser: OWNER, status: "MISSED" }),
    ).rejects.toMatchObject({ statusCode: 422 });
  });

  it("passes with next: schedules the follow-up call after the status write", async () => {
    const future = new Date(Date.now() + 24 * 3600_000).toISOString();
    const r = await updateCallReminderStatus({
      reminderId: 1,
      currentUser: OWNER,
      status: "DONE",
      callResult: "ok",
      next: { type: "CALL", time: future, reason: "follow up" },
    });
    expect(r).toMatchObject({ id: 1 });
    expect(leadRepository.updateCallReminderStatusRecord).toHaveBeenCalled();
    expect(leadRepository.createCallReminderRecord).toHaveBeenCalledWith(
      expect.objectContaining({ clientLeadId: 5, reminderReason: "follow up" }),
    );
  });

  it("passes with noFollowUp: persists the reason as a lead note", async () => {
    await updateCallReminderStatus({
      reminderId: 1,
      currentUser: OWNER,
      status: "DONE",
      callResult: "ok",
      noFollowUp: { reason: "client will travel; call next month manually" },
    });
    expect(leadRepository.createNoteRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        clientLeadId: 5,
        content: expect.stringContaining("No follow-up planned:"),
      }),
    );
  });

  it("exempt when another future touchpoint exists", async () => {
    seed({ hasFuture: true });
    await expect(
      updateCallReminderStatus({ reminderId: 1, currentUser: OWNER, status: "DONE", callResult: "ok" }),
    ).resolves.toBeTruthy();
  });

  it("exempt on non-active lead statuses (e.g. FINALIZED)", async () => {
    seed({ leadStatus: "FINALIZED" });
    await expect(
      updateCallReminderStatus({ reminderId: 1, currentUser: OWNER, status: "DONE", callResult: "ok" }),
    ).resolves.toBeTruthy();
  });

  it("ownership guard unchanged: someone else's reminder → 403 for non-admins", async () => {
    await expect(
      updateCallReminderStatus({ reminderId: 1, currentUser: { id: 99, role: "STAFF" }, status: "DONE" }),
    ).rejects.toMatchObject({ statusCode: 403 });
  });
});

describe("updateMeetingReminderStatus — same enforcement", () => {
  it("DONE on the last touchpoint with no plan → 422", async () => {
    await expect(
      updateMeetingReminderStatus({ reminderId: 1, currentUser: OWNER, status: "DONE", meetingResult: "ok" }),
    ).rejects.toMatchObject({ statusCode: 422, message: "NEXT_TOUCH_REQUIRED" });
  });

  it("passes with noFollowUp", async () => {
    await expect(
      updateMeetingReminderStatus({
        reminderId: 1,
        currentUser: OWNER,
        status: "DONE",
        meetingResult: "ok",
        noFollowUp: { reason: "deal paused by client" },
      }),
    ).resolves.toBeTruthy();
  });
});
