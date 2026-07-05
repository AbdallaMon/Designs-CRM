import { z } from "zod";

// The generic delete (`shared/delete/:id` on the FE → mapped to `/delete/:id`) restores
// master's single delete endpoint after the strangler cutover removed the legacy shared
// router. It is constrained to the sub-resource models the UI's DeleteModelButton actually
// deletes, so it can never be turned into an arbitrary "delete any row by id" (it must never
// reach sensitive standalone models like User / ClientLead / Payment).
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
  // Only `model` is accepted. Any other key (e.g. a client-supplied `deleteModelesBeforeMain`
  // cascade — which the frontend never sends) is stripped by Zod, so this endpoint can never
  // cascade-delete other models.
  remove = z.object({
    model: z.string().refine((m) => DELETABLE_MODELS.includes(m), {
      message: "MODEL_NOT_DELETABLE",
    }),
  });
}

export const genericDeleteSchemas = new GenericDeleteSchemas();
