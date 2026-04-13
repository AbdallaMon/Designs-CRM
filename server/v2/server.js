import { createServer } from "http";
import app from "./app.js";
import { initSocket, getIo } from "./infra/socket/index.js";
import { connectRedis } from "./infra/redis/redis.client.js";
import { startSocketSubscriber } from "../services/redis/socketSubscriber.js";
import { coonnectToTelegramV2 } from "./modules/telegram/connect.js";
import { env } from "./config/env.js";

export const httpServer = createServer(app);

initSocket(httpServer);
startSocketSubscriber(getIo());

(async () => {
  await connectRedis();
  await coonnectToTelegramV2();
  httpServer.listen(env.PORT, () => {
    console.log(`✅ Server running on port ${env.PORT}`);
  });
})();
