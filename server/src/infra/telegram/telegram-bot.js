import { Api } from "telegram";
import { env } from "../../config/env.js";
import { getTeleClient } from "./connect-to-telegram.js";

const BOT_API_ORIGIN = "https://api.telegram.org";
const CHANNEL_ID_OFFSET = 1000000000000n;

let cachedToken = null;
let cachedIdentityPromise = null;

function botToken() {
  return String(env.TELEGRAM_BOT_TOKEN || "").trim();
}

function botApiChatId(channel) {
  const channelId = BigInt(channel?.id?.toString?.() || channel?.id);
  return (-(CHANNEL_ID_OFFSET + channelId)).toString();
}

async function callBotApi(method, payload = {}) {
  const token = botToken();
  if (!token) return null;

  let response;
  try {
    response = await fetch(`${BOT_API_ORIGIN}/bot${token}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error(`Telegram bot ${method} request failed`);
  }

  const body = await response.json().catch(() => null);
  if (!response.ok || !body?.ok) {
    const description = String(body?.description || "").replaceAll(
      token,
      "[redacted]",
    );
    throw new Error(
      `Telegram bot ${method} failed${description ? `: ${description}` : ""}`,
    );
  }
  return body.result;
}

async function getBotIdentity() {
  const token = botToken();
  if (!token) return null;

  if (cachedToken !== token || !cachedIdentityPromise) {
    cachedToken = token;
    cachedIdentityPromise = callBotApi("getMe").catch((error) => {
      cachedIdentityPromise = null;
      throw error;
    });
  }

  return cachedIdentityPromise;
}

function isMissingParticipant(error) {
  return error?.errorMessage === "USER_NOT_PARTICIPANT";
}

export function isTelegramBotConfigured() {
  return Boolean(botToken());
}

export async function ensureTelegramBotInChannel(channel) {
  if (!isTelegramBotConfigured()) return false;

  const identity = await getBotIdentity();
  if (!identity?.username) {
    throw new Error("Telegram bot username is unavailable");
  }

  const userClient = getTeleClient();
  const botEntity = await userClient.getEntity(identity.username);

  try {
    await userClient.invoke(
      new Api.channels.GetParticipant({
        channel,
        participant: botEntity,
      }),
    );
    return true;
  } catch (error) {
    if (!isMissingParticipant(error)) throw error;
  }

  try {
    await userClient.invoke(
      new Api.channels.InviteToChannel({
        channel,
        users: [botEntity],
      }),
    );
  } catch (error) {
    if (error?.errorMessage !== "USER_ALREADY_PARTICIPANT") throw error;
  }

  return true;
}

export async function sendTelegramBotMessage({ channel, message, button }) {
  if (!isTelegramBotConfigured()) return false;

  await ensureTelegramBotInChannel(channel);
  await callBotApi("sendMessage", {
    chat_id: botApiChatId(channel),
    text: message,
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [[{ text: button.text, url: button.url }]],
    },
  });
  return true;
}
