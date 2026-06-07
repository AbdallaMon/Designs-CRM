// leads/lead Zod schemas. Framework-agnostic; `validate(schema, where)` returns 422 +
// details on failure. Legacy accepted loose, untyped query/bodies (e.g. a `filters`
// JSON STRING, arbitrary field/value pairs). We preserve that tolerance: query/list
// schemas `.passthrough()` and coerce only the ids/pagination we actually consume, so
// observable behavior is unchanged while every mutating route still gets a schema.
import { z } from "zod";

const idParam = z.coerce.number().int().positive();

export class LeadValidation {
  // ── params ───────────────────────────────────────────────────────────────────
  static idParams = z.object({ id: idParam });
  static userIdParams = z.object({ userId: idParam });
  static clientLeadIdParams = z.object({ clientLeadId: idParam });
  static meetingIdParams = z.object({ meetingId: idParam });
  static reminderIdParams = z.object({ id: idParam });

  // ── query (kept permissive; legacy read arbitrary searchParams) ────────────────
  static listQuery = z.object({}).passthrough();

  // ── bodies ─────────────────────────────────────────────────────────────────────
  static countryCheck = z.object({ country: z.string().nullish() }).passthrough();

  // PUT / — assign / convert. `userId` only honored for admin-tier (enforced in usecase).
  static assign = z.object({ id: z.coerce.number().int().positive(), userId: z.coerce.number().int().positive().optional() }).passthrough();

  static bulkConvert = z.object({
    ids: z.array(z.coerce.number().int().positive()).min(1),
    userId: z.coerce.number().int().positive(),
  }).passthrough();

  static convert = z.object({
    id: z.coerce.number().int().positive(),
    reasonToConvert: z.string().optional(),
  }).passthrough();

  // Field edit (legacy updateLeadField: { field, inputType, [field]: value }).
  static fieldUpdate = z.object({ field: z.string().min(1), inputType: z.string().optional() }).passthrough();

  // Status / price change — the `/:id/actions/*` body.
  static changeStatus = z.object({
    status: z.string().optional(),
    oldStatus: z.string().optional(),
    averagePrice: z.union([z.string(), z.number()]).optional(),
    discount: z.union([z.string(), z.number()]).optional(),
    priceWithOutDiscount: z.union([z.string(), z.number()]).optional(),
    priceNote: z.string().optional(),
    updatePrice: z.boolean().optional(),
  }).passthrough();

  static createCall = z.object({
    time: z.union([z.string(), z.date()]),
    reminderReason: z.string().optional(),
  }).passthrough();

  static updateCall = z.object({
    status: z.string(),
    callResult: z.string().nullish(),
  }).passthrough();

  static createMeeting = z.object({
    time: z.union([z.string(), z.date()]).optional(),
    reminderReason: z.string().optional(),
    isAdmin: z.boolean().optional(),
    adminId: z.coerce.number().int().positive().optional(),
    type: z.string().optional(),
  }).passthrough();

  static updateMeeting = z.object({
    status: z.string(),
    meetingResult: z.string().nullish(),
  }).passthrough();

  static createPriceOffer = z.object({
    priceOffer: z.object({
      url: z.string().optional(),
      note: z.string().optional(),
      minPrice: z.union([z.string(), z.number()]).optional(),
      maxPrice: z.union([z.string(), z.number()]).optional(),
    }).passthrough(),
  }).passthrough();

  static changePriceOfferStatus = z.object({
    priceOfferId: z.coerce.number().int().positive(),
    isAccepted: z.boolean(),
  }).passthrough();

  static makePayments = z.object({
    paymentType: z.string().optional(),
    payments: z.array(z.object({}).passthrough()).min(1),
    price: z.union([z.string(), z.number()]).optional(),
    note: z.string().optional(),
    paymentReason: z.string().optional(),
  }).passthrough();

  static createFile = z.object({
    url: z.string().min(1),
    name: z.string().min(1),
    description: z.string().optional(),
    userId: z.coerce.number().int().positive().nullish(),
  }).passthrough();

  static createNote = z.object({ content: z.string() }).passthrough();
}
