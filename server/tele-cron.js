// DEPRECATED standalone entrypoint.
//
// The finalized-lead telegram enqueuer now runs inside the main server process via the
// bootstrap in `src/server.js` (gated by RUN_CRON). Kept as a thin shim so existing ops
// tooling that launches this file keeps working; it delegates to the same canonical
// scheduler.
//
// Prefer running the server (`node index.js`) with RUN_CRON=true (the default). When run
// standalone, connect the telegram client first (the bootstrap normally does this).
import { coonnectToTelegramV2 } from "./src/modules/telegram/connect.js";
import { startTelegramCron } from "./src/infra/cron/telegram.cron.js";

console.warn(
  "[deprecated] tele-cron.js: this now runs from the server bootstrap " +
    "(src/server.js, RUN_CRON). Running standalone here for backward compatibility.",
);

await coonnectToTelegramV2();
startTelegramCron();
