import { z } from "zod";

// The compatibility delete endpoint is constrained to sub-resource models used by
// DeleteModelButton. It cannot target standalone sensitive models such as User,
// ClientLead, or Payment.
export const DELETABLE_MODELS = [
  "Note",
  "File",
  "PriceOffers",
  "ExtraService",
  "MeetingReminder",
  "CallReminder",
  "ClientLeadUpdate",
  "DeliverySchedule",
  "contract",
  "contractPaymentCondition",
];

class GenericDeleteSchemas {
  // Only `model` is accepted. Models that need dependent cleanup use server-decided
  // teardown logic; clients cannot submit arbitrary cascade specifications.
  remove = z.object({
    model: z.string().refine((m) => DELETABLE_MODELS.includes(m), {
      message: "MODEL_NOT_DELETABLE",
    }),
  });
}

export const genericDeleteSchemas = new GenericDeleteSchemas();
