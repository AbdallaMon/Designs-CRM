import { Router } from "express";
import clientLeadsModule from "../modules/leads/client/leads.client.module.js";

const router = Router();

router.use("/client/booking-leads", clientLeadsModule);

export default router;
