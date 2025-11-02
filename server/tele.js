// getSession.js

import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions/index.js";
import input from "input";
import dotenv from "dotenv";
dotenv.config();
const apiId = process.env.TELE_API_ID;
const apiHash = process.env.TELE_API_HASH;
const stringSession = new StringSession("");

(async () => {
  const client = new TelegramClient(stringSession, apiId, apiHash, {
    connectionRetries: 5,
  });

  await client.start({
    phoneNumber: async () => await input.text("Phone: "),
    password: async () => await input.text("2FA Password (if any): "),
    phoneCode: async () => await input.text("Code from Telegram: "),
    onError: (err) => console.error(err),
  });

  console.log("✅ Logged in!");
  console.log("🔐 SESSION STRING (save this):");
  console.log(client.session.save());
})();

// $2b$08$Xqn72mfDdomnscpyCoNQROw.dclzHH3C7hztcA9602weMQolp8RSO
