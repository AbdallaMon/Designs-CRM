// start-telegram-system.js
import { connectToTelegram } from "./services/telegram/connectToTelegram.js";
// Ensure single Telegram client connection for all workers in this process
await connectToTelegram();

import { telegramUploadWorker } from "./services/workers/telegramUploadWorker.js";
import { telegramMessageWorker } from "./services/workers/telegramMessageWorker.js";
import { telegramChannelWorker } from "./services/workers/telegramChannelWorker.js";
import { telegramCronWorker } from "./services/workers/telegramCronWorker.js";
import { telegramAddUserWorker } from "./services/workers/telegramAddUserWorker.js";
console.log("🚀 All workers and cron job are running.");
