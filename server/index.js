import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "http";
import { initSocket } from "./services/socket.js";
import clientsRoutes from "./routes/clients.js";
import authRoutes from "./routes/auth.js";
import sharedRoutes from "./routes/shared.js";
import utilityRoutes from "./routes/utility.js";
import staffRoutes from "./routes/staff.js";
import adminRoutes from "./routes/admin.js";
import accountantRoutes from "./routes/accountant.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 4000;
const allowedOrigins = [
  process.env.ORIGIN,
  process.env.OLDORIGIN,
  process.env.COURSESORIGIN,
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

const httpServer = createServer(app);
initSocket(httpServer); // Initialize socket.io with the server
if (process.env.ISLOCAL) {
  app.use(
    "/uploads",
    express.static("E:/home/panel.dreamstudiio.com/public_html/uploads")
  );
}
app.use(express.json());
app.use(cookieParser());
app.use("/auth", authRoutes);
app.use("/shared", sharedRoutes);
app.use("/utility", utilityRoutes);
app.use("/staff", staffRoutes);
app.use("/admin", adminRoutes);
app.use("/accountant", accountantRoutes);
app.use("/client", clientsRoutes);

httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
