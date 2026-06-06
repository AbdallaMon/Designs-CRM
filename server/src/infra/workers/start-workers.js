// Owns the lifecycle of all BullMQ workers for this process.
//
// Worker modules instantiate `new Worker(...)` at import time, so we DYNAMICALLY import the
// barrel only when workers are enabled — that way a server booted with RUN_WORKERS=false
// never opens worker connections at all.
//
// Single-instance ownership: gate the call site on `env.RUN_WORKERS` so that on a
// multi-instance deploy exactly one instance runs the workers.

let workers = [];
let started = false;

/**
 * Starts all BullMQ workers (pdf + the five telegram workers).
 * Idempotent: calling twice is a no-op.
 *
 * NOTE: the telegram workers require a live GramJS connection. The caller
 * (`server.js`) connects telegram BEFORE invoking this, preserving the single-connection
 * constraint that the old detached `start-telegram-system.js` relied on.
 *
 * @returns {Promise<import("bullmq").Worker[]>}
 */
export async function startWorkers() {
  if (started) return workers;
  started = true;

  const mod = await import("./index.js");
  workers = [
    mod.pdfWorker,
    mod.telegramMessageWorker,
    mod.telegramCronWorker,
    mod.telegramChannelWorker,
    mod.telegramAddUserWorker,
    mod.telegramUploadWorker,
  ].filter(Boolean);

  console.log(`✅ Started ${workers.length} BullMQ workers`);
  return workers;
}

/**
 * Gracefully closes all started workers.
 * @returns {Promise<void>}
 */
export async function stopWorkers() {
  if (!started) return;
  await Promise.allSettled(workers.map((w) => w?.close?.()));
  workers = [];
  started = false;
  console.log("🛑 Stopped BullMQ workers");
}
