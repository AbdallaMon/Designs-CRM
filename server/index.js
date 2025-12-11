import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "http";
import { initSocket } from "./services/socket.js";
import clientsRoutes from "./routes/clients/clients.js";
import authRoutes from "./routes/auth/auth.js";
import sharedRoutes from "./routes/shared/index.js";
import utilityRoutes from "./routes/utility/utility.js";
import staffRoutes from "./routes/staff/staff.js";
import adminRoutes from "./routes/admin/admin.js";
import accountantRoutes from "./routes/accountant/accountant.js";
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

const corsOptions = {
  origin(origin, callback) {
    // allow non-browser tools (curl, Postman) with no Origin header
    if (!origin) return callback(null, true);

    // Some proxies (e.g., OpenLiteSpeed) may concatenate duplicate Origin headers with commas
    if (typeof origin === "string" && origin.includes(",")) {
      origin = origin.split(",")[0].trim();
    }

    // Normalize trailing slashes to match env values
    if (origin.endsWith("/")) {
      origin = origin.slice(0, -1);
    }

    const isAllowed = allowedOrigins.includes(origin);

    console.log("CORS Origin:", origin, "allowed?", isAllowed);

    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error(`Not allowed by CORS: ${origin}`));
    }
  },
  credentials: true,
};

// 🔥 MUST be before routes
app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
app.use("/auth", (req, res) => {
  console.log(req.rawHeaders, "req.rawHeaders");
  console.log("origin header parsed by Node:", req.headers.origin);

  authRoutes(req, res);
});
app.use("/shared", sharedRoutes);
app.use("/utility", utilityRoutes);
app.use("/staff", staffRoutes);
app.use("/admin", adminRoutes);
app.use("/accountant", accountantRoutes);
app.use("/client", clientsRoutes);

(async () => {
  await connectToTelegram();
  httpServer.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
})();
