// sales-stages validation — Zod schemas. The mutating body is `.strict()` (reject
// unknown fields → mass-assignment hardening: legacy spread `...req.body` into the
// service). The clientLeadId path param is coerced. Failures auto-return 422 + details.
import { z } from "zod";

const SALES_STAGE_TYPES = [
  "INITIAL_CONTACT",
  "SOCIAL_MEDIA_CHECK",
  "WHATSAPP_QA",
  "MEETING_BOOKED",
  "CLIENT_INFO_UPLOADED",
  "CONSULTATION_BOOKED",
  "FOLLOWUP_AFTER_MEETING",
  "HANDLE_OBJECTIONS",
  "DEAL_CLOSED",
  "AFTER_SALES_FOLLOWUP",
];

// The "virtual" not-initiated sentinel the legacy flow uses for the first/last hop —
// it is NOT a real SalesStageType row (the service skips persistence for it).
const STAGE_KEY = z.enum([...SALES_STAGE_TYPES, "NOT_INITIATED"]);

export class SalesStagesValidation {
  static clientLeadIdParam = z.object({
    clientLeadId: z.coerce.number().int().positive(),
  });

  static setStageBody = z
    .object({
      // advance target — only its `key` is consumed by the service.
      nextStage: z.object({ key: STAGE_KEY }).passthrough().optional(),
      // roll-back inputs.
      currentStageType: STAGE_KEY.optional(),
      curentStageType: STAGE_KEY.optional(), // legacy misspelling — accepted for 1:1 compat
      action: z.enum(["back"]).optional(),
    })
    .strict();
}
