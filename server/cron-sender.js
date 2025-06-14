import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions/index.js";
import dotenv from "dotenv";
import cron from "node-cron";

dotenv.config();

const apiId = parseInt(process.env.TELE_API_ID);
const apiHash = process.env.TELE_API_HASH;
const stringSession = new StringSession(process.env.TELEGRAM_SESSION);
const channelId = parseInt(process.env.CHANNEL_ID);

const client = new TelegramClient(stringSession, apiId, apiHash, {
  connectionRetries: 5,
});

async function start() {
  await client.connect();

  cron.schedule("*/15 * * * * *", async () => {
    try {
      const message = `🔔 Test message sent at ${new Date().toLocaleTimeString()}`;
      await client.sendMessage(channelId, { message });
      console.log("✅ Sent:", message);
    } catch (err) {
      console.error("❌ Failed to send message:", err.message);
    }
  });
}

start();
