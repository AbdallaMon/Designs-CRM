// start-telegram-system.js
// Ensure single Telegram client connection for all workers in this process
import { coonnectToTelegramV2 } from "./v2/modules/telegram/connect.js";
await coonnectToTelegramV2();

import { telegramUploadWorker } from "./services/workers/telegramUploadWorker.js";
import { telegramMessageWorker } from "./services/workers/telegramMessageWorker.js";
import { telegramChannelWorker } from "./services/workers/telegramChannelWorker.js";
import { telegramCronWorker } from "./services/workers/telegramCronWorker.js";
import { telegramAddUserWorker } from "./services/workers/telegramAddUserWorker.js";
console.log("🚀 All workers and cron job are running.");
