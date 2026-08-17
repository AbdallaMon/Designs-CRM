import { createServer } from "http";
import { Server } from "socket.io";

import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { getTelegramManager } from "../../modules/telegram/manager/telegram.manager.js";
import { AppError } from "../../shared/errors/AppError.js";
import { adminResidualMessagesCodes, messagesNames } from "@dms/shared";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

export let io;

/**
 * Always returns the current TelegramClient from the v2 manager singleton.
 * Use this instead of a static `teleClient` export so you always get the
 * live client even after setConfig() replaces it.
 */
export function getTeleClient() {
  return getTelegramManager().getClient();
}
export async function connectToTelegram(withio) {
  try {
    if (withio) {
      const httpServer = createServer();

      io = new Server(httpServer, {
        cors: {
          origin: [
            process.env.DASHBOARD_ORIGIN,
            process.env.COURSES_ORIGIN,
          ],
          credentials: true,
        },
      });

      io.on("connection", (socket) => {
        const userId = socket.handshake.query.userId;
        if (userId) {
          socket.join(userId.toString());
        }
      });

      const PORT = 4020;
      httpServer.listen(PORT);
      return io;
    }
  } catch {
    throw new AppError({
      code: adminResidualMessagesCodes.TELEGRAM_CONNECTION_FAILED,
      statusCode: 503,
      translationKey: messagesNames.adminResidualMessages,
    });
  }
}
