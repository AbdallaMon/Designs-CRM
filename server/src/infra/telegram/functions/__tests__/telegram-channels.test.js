import { beforeEach, describe, expect, it, vi } from "vitest";

const checkAuthorization = vi.fn();
const invoke = vi.fn();
const getMe = vi.fn();
const ensureTelegramBotInChannel = vi.fn();
const queueGetJob = vi.fn();
const queueAdd = vi.fn();

const prisma = {
  clientLead: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  user: { findMany: vi.fn() },
  telegramChannel: {
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
};

vi.mock("../../connect-to-telegram.js", () => ({
  getTeleClient: vi.fn(() => ({ checkAuthorization, invoke, getMe })),
}));
vi.mock("../../../prisma/prisma.js", () => ({ default: prisma }));
vi.mock("../../../queues/telegram-upload.queue.js", () => ({
  telegramUploadQueue: { getJob: queueGetJob, add: queueAdd },
}));
vi.mock("../telegram-members.js", () => ({
  getUserEntitiy: vi.fn(),
  addUsersToATeleChannel: vi.fn(),
  inviteUserToAChannel: vi.fn(),
}));
vi.mock("../telegram-lead-data.js", () => ({
  getLeadsWithOutChannel: vi.fn(),
}));
vi.mock("../../telegram-bot.js", () => ({
  ensureTelegramBotInChannel,
}));

const { createChannelAndAddUsers } = await import("../telegram-channels.js");

describe("Telegram channel creation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    checkAuthorization.mockResolvedValue(true);
    getMe.mockResolvedValue({ id: { value: 1 } });
    prisma.clientLead.findUnique.mockResolvedValue({
      id: 44,
      client: { name: "Client" },
      assignedTo: null,
    });
    prisma.user.findMany.mockResolvedValue([]);
    prisma.telegramChannel.findFirst.mockResolvedValue(null);
    prisma.telegramChannel.create.mockResolvedValue({ id: 1 });
    prisma.clientLead.update.mockResolvedValue({ id: 44 });
    ensureTelegramBotInChannel.mockResolvedValue(true);
    queueGetJob.mockResolvedValue({ id: "already-queued" });

    const channel = { id: 123, accessHash: 456 };
    invoke
      .mockResolvedValueOnce({ chats: [channel] })
      .mockResolvedValueOnce({ link: "https://t.me/+invite" });
  });

  it("adds the configured bot when a lead channel is created", async () => {
    const result = await createChannelAndAddUsers({ clientLeadId: 44 });

    expect(ensureTelegramBotInChannel).toHaveBeenCalledWith(result.channel);
    expect(result.inviteLink).toBe("https://t.me/+invite");
  });
});
