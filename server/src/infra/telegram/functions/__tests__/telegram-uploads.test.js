import { beforeEach, describe, expect, it, vi } from "vitest";

const getJob = vi.fn();
const add = vi.fn();

vi.mock("../../../queues/telegram-message.queue.js", () => ({
  telegramMessageQueue: { getJob, add },
}));
vi.mock("../../connect-to-telegram.js", () => ({
  getTeleClient: vi.fn(),
}));
vi.mock("../../../prisma/prisma.js", () => ({
  default: {},
}));
vi.mock("../../../upload/asset-access.js", () => ({
  buildAssetAccessUrl: vi.fn((value) => value),
}));
vi.mock("../../../../config/env.js", () => ({
  env: { ASSET_EMAIL_URL_TTL_SECONDS: 60 },
}));
vi.mock("../telegram-channels.js", () => ({
  getChannelEntitiyByTeleRecordAndLeadId: vi.fn(),
}));

const { uploadANote, uploadAnAttachment } = await import("../telegram-uploads.js");

describe("Telegram upload queue scheduling", () => {
  beforeEach(() => {
    getJob.mockReset().mockResolvedValue(null);
    add.mockReset().mockResolvedValue({ id: "queued" });
  });

  it("enqueues notes immediately with a delayed job", async () => {
    const note = { id: 12, clientLeadId: 7 };
    await uploadANote(note);

    expect(add).toHaveBeenCalledWith(
      "send-note",
      expect.objectContaining({ type: "note", payload: { clientLeadId: 7, note } }),
      expect.objectContaining({ delay: 2000, jobId: "note-12" }),
    );
  });

  it("enqueues attachments immediately with a delayed job", async () => {
    const file = { id: 21, clientLeadId: 9 };
    await uploadAnAttachment(file);

    expect(add).toHaveBeenCalledWith(
      "send-file",
      expect.objectContaining({ type: "file", payload: { clientLeadId: 9, file } }),
      expect.objectContaining({ delay: 2000, jobId: "file-21" }),
    );
  });
});
