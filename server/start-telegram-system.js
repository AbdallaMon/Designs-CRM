// start-telegram-system.js

import { telegramUploadWorker } from "./services/workers/telegramUploadWorker.js";
import { telegramMessageWorker } from "./services/workers/telegramMessageWorker.js";
import { telegramChannelWorker } from "./services/workers/telegramChannelWorker.js";
import { telegramCronWorker } from "./services/workers/telegramCronWorker.js";

console.log("🚀 All workers and cron job are running.");
