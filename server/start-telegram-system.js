// DEPRECATED standalone entrypoint.
//
// The BullMQ workers now run inside the main server process via the bootstrap in
// `src/server.js` (gated by RUN_WORKERS). This file is kept only so any existing ops
// tooling / process manager that still launches it keeps working — it now delegates to the
// same canonical `startWorkers()` path instead of importing each worker ad-hoc.
//
// Prefer running the server (`node index.js`) with RUN_WORKERS=true (the default).
import { coonnectToTelegramV2 } from "./src/modules/telegram/connect.js";
import { startWorkers } from "./src/infra/workers/start-workers.js";

console.warn(
  "[deprecated] start-telegram-system.js: workers now run from the server bootstrap " +
    "(src/server.js, RUN_WORKERS). Running them standalone here for backward compatibility.",
);

// Ensure the single Telegram client connection for all workers in this process.
await coonnectToTelegramV2();
await startWorkers();
console.log("🚀 All BullMQ workers are running (standalone shim).");
