import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions/index.js";
import { createServer } from "http";
import { Server } from "socket.io";

import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { getTelegramManager } from "../../v2/modules/telegram/manager/telegram.manager.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const apiId = process.env.TELE_API_ID;
const apiHash = process.env.TELE_API_HASH;
const sessionString = process.env.TELEGRAM_SESSION;

export let io;

/**
 * Always returns the current TelegramClient from the v2 manager singleton.
 * Use this instead of a static `teleClient` export so you always get the
 * live client even after setConfig() replaces it.
 */
export function getTeleClient() {
  return getTelegramManager().getClient();
}
// export const teleClient = new TelegramClient(
//   new StringSession(sessionString),
//   apiId,
//   apiHash,
//   {
//     connectionRetries: 5,
//   },
// );

export async function connectToTelegram(withio) {
  try {
    // if (!teleClient.connected) {
    //   return await teleClient.connect();
    //   console.log("✅ Telegram client connected (via session)");
    // }
    if (withio) {
      const httpServer = createServer();

      io = new Server(httpServer, {
        cors: {
          origin: [
            process.env.ORIGIN,
            process.env.OLDORIGIN,
            process.env.COURSESORIGIN,
          ],
          credentials: true,
        },
      });

      io.on("connection", (socket) => {
        const userId = socket.handshake.query.userId;
        if (userId) {
          console.log(`User connected to socket: ${userId}`);
          socket.join(userId.toString());
        }

        socket.on("disconnect", () => {
          console.log("User disconnected");
        });
      });

      const PORT = 4020;
      httpServer.listen(PORT, () => {
        console.log(`🔌 Socket.IO server running on port ${PORT}`);
      });
      return io;
    }
  } catch (err) {
    console.error("❌ Failed to connect to Telegram:", err.message);
    throw err;
  }
}
