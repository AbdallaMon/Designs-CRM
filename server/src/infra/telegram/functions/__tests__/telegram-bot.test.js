import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { env } from "../../../../config/env.js";

const getEntity = vi.fn();
const invoke = vi.fn();
let tokenSequence = 0;
const originalFetch = global.fetch;
const originalBotToken = env.TELEGRAM_BOT_TOKEN;

vi.mock("../../connect-to-telegram.js", () => ({
  getTeleClient: vi.fn(() => ({ getEntity, invoke })),
}));

const {
  ensureTelegramBotInChannel,
  isTelegramBotConfigured,
  sendTelegramBotMessage,
} = await import("../../telegram-bot.js");

describe("Telegram bot button sender", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    tokenSequence += 1;
    env.TELEGRAM_BOT_TOKEN = `test-token-${tokenSequence}`;
    getEntity.mockReset().mockResolvedValue({ id: 55 });
    invoke.mockReset();
    global.fetch = vi.fn();
  });

  afterAll(() => {
    global.fetch = originalFetch;
    env.TELEGRAM_BOT_TOKEN = originalBotToken;
  });

  it("stays disabled without a bot token", async () => {
    env.TELEGRAM_BOT_TOKEN = "";

    expect(isTelegramBotConfigured()).toBe(false);
    await expect(
      sendTelegramBotMessage({
        channel: { id: 123 },
        message: "File",
        button: { text: "Open File", url: "https://example.test/file" },
      }),
    ).resolves.toBe(false);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("adds a missing bot to the channel", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ ok: true, result: { username: "dream_bot" } }),
    });
    invoke
      .mockRejectedValueOnce({ errorMessage: "USER_NOT_PARTICIPANT" })
      .mockResolvedValueOnce({});

    await expect(ensureTelegramBotInChannel({ id: 123 })).resolves.toBe(true);

    expect(getEntity).toHaveBeenCalledWith("dream_bot");
    expect(invoke).toHaveBeenCalledTimes(2);
  });

  it("sends the preserved uploader message with an inline URL button", async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({ ok: true, result: { username: "dream_bot" } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({ ok: true, result: { message_id: 1 } }),
      });
    invoke.mockResolvedValue({});

    await expect(
      sendTelegramBotMessage({
        channel: { id: 123 },
        message: "📁 *File from Mona*\n📄 drawing.jpg",
        button: { text: "Open File", url: "https://example.test/file" },
      }),
    ).resolves.toBe(true);

    const [, request] = global.fetch.mock.calls[1];
    expect(JSON.parse(request.body)).toEqual({
      chat_id: "-1000000000123",
      text: "📁 *File from Mona*\n📄 drawing.jpg",
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [[{ text: "Open File", url: "https://example.test/file" }]],
      },
    });
  });

  it("surfaces Telegram's safe API description when a button is rejected", async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({ ok: true, result: { username: "dream_bot" } }),
      })
      .mockResolvedValueOnce({
        ok: false,
        json: vi.fn().mockResolvedValue({
          ok: false,
          error_code: 400,
          description: "Bad Request: BUTTON_URL_INVALID",
        }),
      });
    invoke.mockResolvedValue({});

    await expect(
      sendTelegramBotMessage({
        channel: { id: 123 },
        message: "File",
        button: { text: "Open File", url: "http://localhost:4001/file" },
      }),
    ).rejects.toThrow(
      "Telegram bot sendMessage failed: Bad Request: BUTTON_URL_INVALID",
    );
  });
});
