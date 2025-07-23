import { Api, TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions/index.js";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";

dotenv.config();

const apiId = process.env.TELE_API_ID;
const apiHash = process.env.TELE_API_HASH;
const sessionString = process.env.TELEGRAM_SESSION;

export let io;
export const teleClient = new TelegramClient(
  new StringSession(sessionString),
  apiId,
  apiHash,
  {
    connectionRetries: 5,
  }
);

export async function connectToTelegram(withio) {
  if (!teleClient.connected) {
    return await teleClient.connect();
    console.log("✅ Telegram client connected (via session)");
  }
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
}
