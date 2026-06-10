import { z } from "zod";

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
  .string({ error: "phone must be a string" })
  .trim()
  .min(1, "phone is required")
  .regex(/^[0-9+()\-\s]{6,20}$/, "phone must be a valid phone number");

const emailSchema = z
  .string({ error: "email must be a string" })
  .trim()
  .email("email must be a valid email address");

// ── Schemas ────────────────────────────────────────────────────────────────────

class BookingLeadSchemas {
  leadIdParams = z.object({
    leadId: z.coerce
      .number()
      .int()
      .positive("leadId must be a positive integer"),
  });

  // name/phone are optional at registration (master fdefbbf "edit client register"):
  // missing values fall back to the same draft placeholders the legacy funnel writes.
  createBookingLead = z
    .object({
      name: z.string({ error: "name must be a string" }).trim().optional(),
      phone: z.string({ error: "phone must be a string" }).trim().optional(),
    })
    .transform((body) => ({
      name: body.name || "draft",
      phone: body.phone || "+0123456789",
    }));

  // PATCH accepts exactly one field at a time — validated imperatively in the usecase.
  // Here we just ensure the body is a plain object with at least one known key.
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
    .refine(
      (data) => Object.values(data).some((v) => v !== undefined),
      "PATCH requires exactly one supported field per request",
    );

  submitBookingLead = z.object({
    location: z
      .string({ error: "location must be a string" })
      .trim()
      .min(1, "location is required"),
    projectType: z
      .string({ error: "projectType must be a string" })
      .trim()
      .min(1, "projectType is required"),
    projectStage: z
      .string({ error: "projectStage must be a string" })
      .trim()
      .min(1, "projectStage is required"),
    previousWork: z
      .string({ error: "previousWork must be a string" })
      .trim()
      .min(1, "previousWork is required"),
    hasArchitecturalPlan: z
      .string({ error: "hasArchitecturalPlan must be a string" })
      .trim()
      .min(1, "hasArchitecturalPlan is required"),
    serviceType: z
      .string({ error: "serviceType must be a string" })
      .trim()
      .min(1, "serviceType is required"),
    decisionMaker: z
      .string({ error: "decisionMaker must be a string" })
      .trim()
      .min(1, "decisionMaker is required"),
    name: z
      .string({ error: "name must be a string" })
      .trim()
      .min(1, "name is required"),
    phone: phoneSchema,
    email: emailSchema,
    contactAgreement: z
      .boolean({ error: "contactAgreement must be a boolean" })
      .refine((v) => v === true, "contactAgreement must be accepted"),
    contactInitialPriceAgreement: z
      .boolean({ error: "contactInitialPriceAgreement must be a boolean" })
      .refine(
        (v) => v === true,
        "contactInitialPriceAgreement must be accepted",
      ),
  });
}

export const bookingLeadSchemas = new BookingLeadSchemas();
