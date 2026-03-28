import { Router } from "express";
import authRoutes from "./modules/auth/auth.routes.js";

const router = Router();

router.use("/auth", authRoutes);

// Future modules:
// router.use("/chat", chatRoutes);
// router.use("/users", usersRoutes);

export { router };
