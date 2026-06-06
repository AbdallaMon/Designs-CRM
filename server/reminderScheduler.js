// DEPRECATED standalone entrypoint.
//
// Meeting/call reminders now run inside the main server process via the bootstrap in
// `src/server.js` (gated by RUN_CRON). Kept as a thin shim so existing ops tooling that
// launches this file keeps working; it delegates to the same canonical scheduler.
//
// Prefer running the server (`node index.js`) with RUN_CRON=true (the default).
import { startRemindersCron } from "./src/infra/cron/reminders.cron.js";

console.warn(
  "[deprecated] reminderScheduler.js: reminders now run from the server bootstrap " +
    "(src/server.js, RUN_CRON). Running standalone here for backward compatibility.",
);

startRemindersCron();
