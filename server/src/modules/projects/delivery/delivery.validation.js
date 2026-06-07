// projects/delivery Zod schemas. Coerce only the ids we consume; loose otherwise.
import { z } from "zod";

const idParam = z.coerce.number().int().positive();

export class DeliveryValidation {
  // ── params ───────────────────────────────────────────────────────────────────
  static projectIdParams = z.object({ projectId: idParam });
  static deliveryIdParams = z.object({ deliveryId: idParam });

  // ── bodies ─────────────────────────────────────────────────────────────────────
  static create = z.object({
    projectId: z.coerce.number().int().positive(),
    deliveryAt: z.union([z.string(), z.date()]),
    name: z.string().nullish(),
  }).passthrough();

  static linkMeeting = z.object({
    meetingReminderId: z.coerce.number().int().positive(),
  }).passthrough();
}
