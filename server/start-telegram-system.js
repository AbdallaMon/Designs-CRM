// start-telegram-system.js
// Ensure single Telegram client connection for all workers in this process
import { coonnectToTelegramV2 } from "./v2/modules/telegram/connect.js";
await coonnectToTelegramV2();

import "./v2/infra/workers/telegram-upload.worker.js";
import "./v2/infra/workers/telegram-message.worker.js";
import "./v2/infra/workers/telegram-channel.worker.js";
import "./v2/infra/workers/telegram-cron.worker.js";
import "./v2/infra/workers/telegram-add-user.worker.js";
console.log("🚀 All Telegram workers are running.");
