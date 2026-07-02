import { createServer } from "http";
import app from "./app.js";
import { initSocket, getIo } from "./infra/socket/index.js";
import { connectRedis } from "./infra/redis/redis.client.js";
import { startSocketSubscriber } from "../services/redis/socketSubscriber.js";
import { coonnectToTelegramV2 } from "./modules/telegram/connect.js";
import { startWorkers } from "./infra/workers/start-workers.js";
import { startCron } from "./infra/cron/index.js";
import { env } from "./config/env.js";
import prisma from "@dms/db";
import { runProfileBackfill } from "./bootstrap/backfill-profiles.js";

export const httpServer = createServer(app);

initSocket(httpServer);
startSocketSubscriber(getIo());

(async () => {
  await connectRedis();

  // One-time (idempotent) profile backfill: assign profiles to users created before
  // the profiles feature. Non-fatal — never block the API from serving HTTP.
  try {
    const r = await runProfileBackfill({ prisma });
    if (r.updated) console.log(`✅ Profile backfill: ${r.updated}/${r.scanned} users assigned`);
  } catch (e) {
    console.error("❌ Profile backfill failed:", e?.message);
  }

  // Connect the single GramJS client BEFORE workers/cron so the telegram workers and the
  // telegram cron reuse one connection (replaces the detached start-telegram-system.js).
  await coonnectToTelegramV2();

  // Server-owned BullMQ workers (gated for single-instance ownership). Failures here must
  // not stop the API from serving HTTP.
  if (env.RUN_WORKERS) {
    try {
      await startWorkers();
    } catch (e) {
      console.error("❌ Failed to start workers:", e?.message);
    }
  } else {
    console.log("⏭️  RUN_WORKERS=false — BullMQ workers disabled");
  }

  // Server-owned cron schedulers (gated for single-instance ownership).
  if (env.RUN_CRON) {
    try {
      startCron();
    } catch (e) {
      console.error("❌ Failed to start cron:", e?.message);
    }
  } else {
    console.log("⏭️  RUN_CRON=false — cron schedulers disabled");
  }

  httpServer.listen(env.PORT, () => {
    console.log(`✅ Server running on port ${env.PORT}`);
  });
})();
