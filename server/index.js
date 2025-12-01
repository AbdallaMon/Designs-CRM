/**
 * Server Entry Point
 *
 * This is the main server file that initializes Express, mounts routes,
 * and starts the HTTP server.
 */

import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "http";
import { initSocket } from "./services/socket.js";

// Import routes from organized folder structure
import clientRoutes from "./routes/client/index.js";
import authRoutes from "./routes/auth/index.js";
import sharedRoutes from "./routes/shared/index.js";
import utilityRoutes from "./routes/utility/index.js";
import staffRoutes from "./routes/staff/index.js";
import adminRoutes from "./routes/admin/index.js";
import accountantRoutes from "./routes/accountant/index.js";

import { connectToTelegram } from "./services/telegram/connectToTelegram.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 4000;
export const allowedOrigins = [
  process.env.ORIGIN,
  process.env.OLDORIGIN,
  process.env.COURSESORIGIN,
  process.env.PORTFOLIOORIGIN,
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

export const httpServer = createServer(app);
initSocket(httpServer);
if (process.env.ISLOCAL) {
  app.use(
    "/uploads",
    express.static("E:/home/panel.dreamstudiio.com/public_html/uploads")
  );
}
app.use(express.json());
app.use(cookieParser());

// Mount routes
app.use("/auth", authRoutes);
app.use("/shared", sharedRoutes);
app.use("/utility", utilityRoutes);
app.use("/staff", staffRoutes);
app.use("/admin", adminRoutes);
app.use("/accountant", accountantRoutes);
app.use("/client", clientRoutes);

(async () => {
  await connectToTelegram();
  httpServer.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
})();
