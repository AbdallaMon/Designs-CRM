import { Router } from "express";
import { asyncHandler } from "../../../shared/middlewares/async-handler.js";
import { stripeWebhookController } from "./stripe-webhook.controller.js";

const router = Router();

router.post("/webhook", asyncHandler(stripeWebhookController.handle));

export { router as stripeWebhookRouter };
