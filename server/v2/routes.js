import { Router } from "express";
import authRoutes from "./modules/auth/auth.routes.js";
import clientLeadsRoutes from "./modules/leads/client/booking-leads.routes.js";

const router = Router();

router.use("/auth", authRoutes);
// router.use("/users", usersRoutes);
router.use("/client/booking-leads", clientLeadsRoutes);

// Future modules:
// router.use("/chat", chatRoutes);
// router.use("/users", usersRoutes);

export { router };
