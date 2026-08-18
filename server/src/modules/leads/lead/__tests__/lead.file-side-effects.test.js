import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../lead.repo.js", () => ({
  leadRepository: {
    createFileRecord: vi.fn(),
    touchLead: vi.fn(),
  },
  LeadRepository: class {},
}));

vi.mock("../../../../infra/telegram/telegram-functions.js", () => ({
  getChannelEntitiyByTeleRecordAndLeadId: vi.fn(),
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
  getChannelEntitiyByTeleRecordAndLeadId,
  uploadAnAttachment,
} from "../../../../infra/telegram/telegram-functions.js";
import { newFileUploaded } from "../../../../infra/notifications/index.js";
import { createFile } from "../lead.sub-resources.usecase.js";

const INPUT = {
  clientLeadId: 12,
  url: "/uploads/leads/design.png",
  name: "design.png",
  description: "Initial design",
  userId: 7,
};

beforeEach(() => {
  vi.clearAllMocks();
  leadRepository.createFileRecord.mockResolvedValue({
    id: 44,
    clientLeadId: 12,
    userId: 7,
    ...INPUT,
  });
  leadRepository.touchLead.mockResolvedValue(undefined);
  uploadAnAttachment.mockResolvedValue(undefined);
  newFileUploaded.mockResolvedValue(undefined);
});

describe("createFile — optional integrations", () => {
  it("returns the saved file when Telegram rejects the queued attachment", async () => {
    uploadAnAttachment.mockRejectedValue(new Error("400: CHANNEL_INVALID"));
    const errorLog = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(createFile(INPUT)).resolves.toMatchObject({
      id: 44,
      name: "design.png",
      isUserFile: true,
    });

    expect(getChannelEntitiyByTeleRecordAndLeadId).not.toHaveBeenCalled();
    expect(newFileUploaded).toHaveBeenCalled();
    expect(leadRepository.touchLead).toHaveBeenCalledWith({ id: 12 });
    expect(errorLog).toHaveBeenCalledWith(
      "Optional Telegram attachment failed:",
      "400: CHANNEL_INVALID",
    );
    errorLog.mockRestore();
  });

  it("returns the saved file when its notification fails", async () => {
    newFileUploaded.mockRejectedValue(new Error("notification unavailable"));
    const errorLog = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(createFile(INPUT)).resolves.toMatchObject({ id: 44 });
    expect(uploadAnAttachment).toHaveBeenCalled();
    expect(leadRepository.touchLead).toHaveBeenCalledWith({ id: 12 });
    expect(errorLog).toHaveBeenCalledWith(
      "Optional file notification failed:",
      "notification unavailable",
    );
    errorLog.mockRestore();
  });

  it("still rejects when the primary file record cannot be saved", async () => {
    leadRepository.createFileRecord.mockRejectedValue(new Error("database unavailable"));

    await expect(createFile(INPUT)).rejects.toThrow("database unavailable");
    expect(uploadAnAttachment).not.toHaveBeenCalled();
    expect(newFileUploaded).not.toHaveBeenCalled();
    expect(leadRepository.touchLead).not.toHaveBeenCalled();
  });
});
