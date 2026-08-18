import { beforeEach, describe, expect, it, vi } from "vitest";

const getJob = vi.fn();
const add = vi.fn();
const sendMessage = vi.fn();
const sendTelegramBotMessage = vi.fn();

vi.mock("../../../queues/telegram-message.queue.js", () => ({
  telegramMessageQueue: { getJob, add },
}));
vi.mock("../../connect-to-telegram.js", () => ({
  getTeleClient: vi.fn(() => ({ sendMessage })),
}));
vi.mock("../../telegram-bot.js", () => ({
  sendTelegramBotMessage,
}));
vi.mock("../../../prisma/prisma.js", () => ({
  default: {},
}));
vi.mock("../../../upload/asset-access.js", () => ({
  buildAssetAccessUrl: vi.fn((value) => `${value}?expires=123&signature=old`),
  buildAuthenticatedAttachmentUrl: vi.fn(
    ({ type, id }) => `https://api.example.test/v2/files/attachments/${type}/${id}`,
  ),
}));
vi.mock("../../../upload/upload-reference.js", () => ({
  normalizeUploadReference: vi.fn((value) =>
    String(value || "").startsWith("/uploads/") ? value : null,
  ),
}));
vi.mock("../../../../config/env.js", () => ({
  env: { ASSET_EMAIL_URL_TTL_SECONDS: 60 },
}));
vi.mock("../telegram-channels.js", () => ({
  getChannelEntitiyByTeleRecordAndLeadId: vi.fn(),
}));

const {
  uploadANote,
  uploadAnAttachment,
  uploadAQueueNote,
  uploadAQueueAttachment,
} = await import("../telegram-uploads.js");

describe("Telegram upload queue scheduling", () => {
  beforeEach(() => {
    getJob.mockReset().mockResolvedValue(null);
    add.mockReset().mockResolvedValue({ id: "queued" });
    sendMessage.mockReset().mockResolvedValue({ id: 1 });
    sendTelegramBotMessage.mockReset().mockResolvedValue(false);
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

  it("sends note attachments as durable authenticated record links without expiry", async () => {
    await uploadAQueueNote(
      {
        id: 12,
        clientLeadId: 7,
        content: "See attachment",
        attachment: "/uploads/notes/photo.jpg",
      },
      "channel",
    );

    const message = sendMessage.mock.calls[0][1].message;
    expect(message).toContain("https://api.example.test/v2/files/attachments/note/12");
    expect(message).not.toContain("expires=");
    expect(message).not.toContain("signature=");
  });

  it("sends lead files as durable authenticated record links without expiry", async () => {
    await uploadAQueueAttachment(
      {
        id: 21,
        clientLeadId: 9,
        name: "drawing.jpg",
        url: "/uploads/leads/drawing.jpg",
        isUserFile: false,
      },
      "channel",
    );

    const message = sendMessage.mock.calls[0][1].message;
    expect(message).toContain("https://api.example.test/v2/files/attachments/lead-file/21");
    expect(message).not.toContain("expires=");
    expect(message).not.toContain("signature=");
  });

  it("uses the bot button while preserving uploader details when the bot is available", async () => {
    sendTelegramBotMessage.mockResolvedValue(true);

    await uploadAQueueAttachment(
      {
        id: 21,
        clientLeadId: 9,
        name: "drawing.jpg",
        description: "Final drawing",
        url: "/uploads/leads/drawing.jpg",
        isUserFile: true,
        user: { name: "Mona" },
      },
      "channel",
    );

    expect(sendTelegramBotMessage).toHaveBeenCalledWith({
      channel: "channel",
      message: expect.stringContaining("File from Mona"),
      button: {
        text: "Open File",
        url: "https://api.example.test/v2/files/attachments/lead-file/21",
      },
    });
    expect(sendTelegramBotMessage.mock.calls[0][0].message).toContain("Final drawing");
    expect(sendMessage).not.toHaveBeenCalled();
  });
});
