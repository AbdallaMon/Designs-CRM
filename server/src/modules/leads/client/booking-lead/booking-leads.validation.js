import { validationMessagesCodes as V } from "@dms/shared";
import { z } from "zod";
import { publicLeadSourceSchema } from "../public-lead-source.js";

// ── Field sets (still needed by usecase to route data to lead vs client) ───────

const LEAD_FIELDS = new Set([
  "location",
  "projectType",
  "projectStage",
  "previousWork",
  "hasArchitecturalPlan",
  "serviceType",
  "decisionMaker",
]);

const CLIENT_FIELDS = new Set([
  "name",
  "phone",
  "email",
  "contactAgreement",
  "contactInitialPriceAgreement",
]);

export function isLeadField(field) {
  return LEAD_FIELDS.has(field);
}

export function isClientField(field) {
  return CLIENT_FIELDS.has(field);
}

// ── Shared field schemas ───────────────────────────────────────────────────────

const phoneSchema = z
  .string({ error: V.EXPECTED_STRING })
  .trim()
  .min(1, V.FIELD_REQUIRED)
  .regex(/^[0-9+()\-\s]{6,20}$/, V.INVALID_PHONE_NUMBER);

const emailSchema = z
  .string({ error: V.EXPECTED_STRING })
  .trim()
  .email(V.INVALID_EMAIL_ADDRESS);

// ── Schemas ────────────────────────────────────────────────────────────────────

class BookingLeadSchemas {
  leadIdParams = z.object({
    leadId: z.coerce
      .number()
      .int()
      .positive(V.POSITIVE_INTEGER_REQUIRED),
  });

  // name/phone are optional at registration (master fdefbbf "edit client register"):
  // missing values fall back to the same draft placeholders the legacy funnel writes.
  createBookingLead = z
    .object({
      name: z.string({ error: V.EXPECTED_STRING }).trim().optional(),
      phone: z.string({ error: V.EXPECTED_STRING }).trim().optional(),
      source: publicLeadSourceSchema.optional(),
    })
    .transform((body) => ({
      name: body.name || "draft",
      phone: body.phone || "+0123456789",
      source: body.source,
    }));

  // PATCH accepts exactly one allow-listed field at a time.
  patchBookingLead = z
    .object({
      location: z.string().trim().optional(),
      projectType: z.string().trim().optional(),
      projectStage: z.string().trim().optional(),
      previousWork: z.string().trim().optional(),
      hasArchitecturalPlan: z.string().trim().optional(),
      serviceType: z.string().trim().optional(),
      decisionMaker: z.string().trim().optional(),
      name: z.string().trim().optional(),
      phone: phoneSchema.optional(),
      email: emailSchema.optional(),
      contactAgreement: z.boolean().optional(),
      contactInitialPriceAgreement: z.boolean().optional(),
    })
    .strict()
    .refine(
      (data) =>
        Object.values(data).filter((value) => value !== undefined).length === 1,
      V.EXACTLY_ONE_FIELD_REQUIRED,
    );

  submitBookingLead = z.object({
    location: z
      .string({ error: V.EXPECTED_STRING })
      .trim()
      .min(1, V.FIELD_REQUIRED),
    projectType: z
      .string({ error: V.EXPECTED_STRING })
      .trim()
      .min(1, V.FIELD_REQUIRED),
    projectStage: z
      .string({ error: V.EXPECTED_STRING })
      .trim()
      .min(1, V.FIELD_REQUIRED),
    previousWork: z
      .string({ error: V.EXPECTED_STRING })
      .trim()
      .min(1, V.FIELD_REQUIRED),
    hasArchitecturalPlan: z
      .string({ error: V.EXPECTED_STRING })
      .trim()
      .min(1, V.FIELD_REQUIRED),
    serviceType: z
      .string({ error: V.EXPECTED_STRING })
      .trim()
      .min(1, V.FIELD_REQUIRED),
    decisionMaker: z
      .string({ error: V.EXPECTED_STRING })
      .trim()
      .min(1, V.FIELD_REQUIRED),
    name: z
      .string({ error: V.EXPECTED_STRING })
      .trim()
      .min(1, V.FIELD_REQUIRED),
    phone: phoneSchema,
    email: emailSchema,
    contactAgreement: z
      .boolean({ error: V.EXPECTED_BOOLEAN })
      .refine((v) => v === true, V.AGREEMENT_REQUIRED),
    contactInitialPriceAgreement: z
      .boolean({ error: V.EXPECTED_BOOLEAN })
      .refine(
        (v) => v === true,
        V.AGREEMENT_REQUIRED,
      ),
  });
}

export const bookingLeadSchemas = new BookingLeadSchemas();
