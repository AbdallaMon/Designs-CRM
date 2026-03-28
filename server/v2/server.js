import { createServer } from "http";
import { app } from "./app.js";
import { initSocket } from "./infra/socket.js";
import { connectToTelegram } from "./infra/telegram.js";
import { env } from "./config/env.js";

const httpServer = createServer(app);

initSocket(httpServer);

(async () => {
  await connectToTelegram();
  httpServer.listen(env.PORT, () => {
    console.log(`[v2] Server running on port ${env.PORT}`);
  });
})();
