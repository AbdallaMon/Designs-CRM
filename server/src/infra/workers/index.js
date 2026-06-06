// Starts all BullMQ workers for this process.
// Import this file once in the entry point (start-telegram-system.js or server.js as needed).
export { pdfWorker } from "./pdf.worker.js";
export { telegramMessageWorker } from "./telegram-message.worker.js";
export { telegramCronWorker } from "./telegram-cron.worker.js";
export { telegramChannelWorker } from "./telegram-channel.worker.js";
export { telegramAddUserWorker } from "./telegram-add-user.worker.js";
export { telegramUploadWorker } from "./telegram-upload.worker.js";
