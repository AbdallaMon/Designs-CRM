import { Api, TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions/index.js";
import dotenv from "dotenv";
dotenv.config();
const apiId = process.env.TELE_API_ID;
const apiHash = process.env.TELE_API_HASH;
const sessionString = process.env.TELEGRAM_SESSION;

export const teleClient = new TelegramClient(
  new StringSession(sessionString),
  apiId,
  apiHash,
  {
    connectionRetries: 5,
  }
);

export async function connectToTelegram() {
  if (!teleClient.connected) {
    return await teleClient.connect();
    console.log("✅ Telegram client connected (via session)");
  }
}
