// Owns the lifecycle of all server-side cron schedulers.
//
// Folds the three standalone scheduler scripts (reminderScheduler.js,
// projectDeliveryTimeReminder.js, tele-cron.js) into the server bootstrap.
//
// Single-instance ownership: gate the call site on `env.RUN_CRON` so that on a
// multi-instance deploy exactly one instance owns the schedulers (avoids double-firing).
import { startRemindersCron } from "./reminders.cron.js";
import { startProjectDeliveryCron } from "./project-delivery.cron.js";
import { startTelegramCron } from "./telegram.cron.js";

let tasks = [];
let started = false;

/**
 * Starts all cron schedulers. Idempotent.
 * Telegram-dependent crons assume the GramJS client is already connected by the bootstrap.
 * @returns {import("node-cron").ScheduledTask[]}
 */
export function startCron() {
  if (started) return tasks;
  started = true;

  tasks = [
    startRemindersCron(),
    startProjectDeliveryCron(),
    startTelegramCron(),
  ].filter(Boolean);

  console.log(`✅ Started ${tasks.length} cron schedulers`);
  return tasks;
}

/**
 * Stops all started cron schedulers.
 * @returns {void}
 */
export function stopCron() {
  if (!started) return;
  for (const t of tasks) t?.stop?.();
  tasks = [];
  started = false;
  console.log("🛑 Stopped cron schedulers");
}
