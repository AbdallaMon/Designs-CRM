// contracts/contract Zod schemas. Mutating bodies are `.strict()` — they whitelist ONLY
// the fields the FROZEN legacy contract service actually consumes (mass-assignment
// hardening: the legacy routes spread `req.body` straight into the service). Path ids are
// authoritative over the body. Money fields are coerced to NUMBERS and constrained
// (finite, >= 0) at the edge IN ADDITION to the legacy service-side checks (which are
// preserved untouched — e.g. createContract still requires amount > 0 per payment).
//
// Field whitelists were derived by reading every consumed field in
// `services/main/contract/contractServices.js`:
//   - createContract: clientLeadId, drawings[], payments[], projectGroupId, specialItems[],
//     stages[], title, enTitle, arName, enName, oldContractId, markOldAsCancelled
//   - updateContractBasics: projectGroupId, title, enTitle, arName, enName
//   - createContractStage / updateContractStage: levelEnum + arbitrary stage fields;
//     update reads deliveryDays, deptDeliveryDays
//   - payments: amount, note, condition, conditionId, type
//   - drawings: url, fileName
//   - special items: labelAr, labelEn
import { z } from "zod";

const idParam = z.coerce.number().int().positive();

// A money amount: coerce string|number → number, reject NaN / negative. Legacy enforces
// the stricter ">0 per create payment" rule inside the service (preserved); here we reject
// the obviously-invalid (NaN / negative) at the edge.
const money = z.coerce.number().refine((n) => Number.isFinite(n) && n >= 0, {
  message: "amount must be a finite number >= 0",
});

// A single payment as consumed by createPayments/createContractPayment. Kept permissive
// for the optional service-driven fields but `.strict()` to block injected columns; the
// amount is money-validated.
const paymentItem = z
  .object({
    amount: money,
    note: z.string().nullish(),
    condition: z.string().nullish(),
    conditionId: z.union([z.coerce.number().int(), z.string()]).nullish(),
    type: z.string().nullish(),
  })
  .strict();

// A single stage as consumed by createStages/createStage. `levelEnum` drives the stage
// title/order; deliveryDays/deptDeliveryDays are the consumed numeric fields. Kept
// `.passthrough()` is NOT used — only the known consumed fields are accepted (`.strict()`).
const stageItem = z
  .object({
    levelEnum: z.string().min(1),
    deliveryDays: z.coerce.number().int().nonnegative().optional(),
    deptDeliveryDays: z.coerce.number().int().nonnegative().optional(),
    isActive: z.boolean().optional(),
  })
  .strict();

const drawingItem = z
  .object({
    url: z.string().min(1),
    fileName: z.string().nullish(),
  })
  .strict();

const specialItemItem = z
  .object({
    labelAr: z.string().nullish(),
    labelEn: z.string().nullish(),
  })
  .strict();

export class ContractValidation {
  // ── params ─────────────────────────────────────────────────────────────────────
  static leadIdParam = z.object({ leadId: idParam });
  static contractIdParam = z.object({ contractId: idParam });
  static contractStageParams = z.object({ contractId: idParam, stageId: idParam });
  static contractDrawingParams = z.object({ contractId: idParam, drawId: idParam });
  static contractSpecialItemParams = z.object({ contractId: idParam, itemId: idParam });
  static contractPaymentParams = z.object({ contractId: idParam, paymentId: idParam });
  static paymentIdParam = z.object({ paymentId: idParam });

  // ── query (kept permissive; legacy read arbitrary searchParams for the grouped list) ──
  static paymentsListQuery = z.object({}).passthrough();

  // ── bodies ───────────────────────────────────────────────────────────────────────
  // POST / — createContract
  static create = z
    .object({
      clientLeadId: z.coerce.number().int().positive(),
      title: z.string().nullish(),
      enTitle: z.string().nullish(),
      arName: z.string().nullish(),
      enName: z.string().nullish(),
      projectGroupId: z.union([z.coerce.number().int(), z.string()]).nullish(),
      payments: z.array(paymentItem).min(1),
      stages: z.array(stageItem).min(1),
      drawings: z.array(drawingItem).optional(),
      specialItems: z.array(specialItemItem).optional(),
      oldContractId: z.coerce.number().int().positive().nullish(),
      markOldAsCancelled: z.boolean().optional(),
    })
    .strict();

  // PUT /:contractId/basics — updateContractBasics
  static updateBasics = z
    .object({
      title: z.string().nullish(),
      enTitle: z.string().nullish(),
      arName: z.string().nullish(),
      enName: z.string().nullish(),
      projectGroupId: z.union([z.coerce.number().int(), z.string()]).nullish(),
    })
    .strict();

  // POST /:contractId/stages — createContractStage (single stage payload)
  static createStage = stageItem;

  // PUT /:contractId/stages/:stageId — updateContractStage
  static updateStage = z
    .object({
      deliveryDays: z.coerce.number().int().nonnegative().optional(),
      deptDeliveryDays: z.coerce.number().int().nonnegative().optional(),
    })
    .strict();

  // POST /:contractId/payments — createNewContractPayment
  static createPayment = paymentItem;

  // PUT /:contractId/payments/:paymentId — updateContractPayment
  static updatePayment = z
    .object({
      amount: money.optional(),
      condition: z.string().nullish(),
      conditionId: z.union([z.coerce.number().int(), z.string()]).nullish(),
      type: z.string().nullish(),
      note: z.string().nullish(),
    })
    .strict();

  // POST /:contractId/payments/:paymentId/actions/change-status (and the legacy
  // `/payments/:paymentId/status` alias) — updateContractPaymentStatus
  static changePaymentStatus = z
    .object({
      status: z.string().min(1),
    })
    .strict();

  // POST /:contractId/payments/:paymentId/actions/update-amounts (legacy
  // `/payments/:paymentId/amounts`) — updateContractPaymentAmounts. Money-validated.
  static updatePaymentAmounts = z
    .object({
      amountLost: money.optional(),
      amountReceived: money.optional(),
      status: z.string().nullish(),
    })
    .strict();

  // POST /:contractId/drawings — createContractDrawing
  static createDrawing = drawingItem;

  // PUT /:contractId/drawings/:drawId — updateContractDrwaing
  static updateDrawing = z
    .object({
      url: z.string().min(1).optional(),
      fileName: z.string().nullish(),
    })
    .strict();

  // POST /:contractId/special-items — createContractSpecialItem
  static createSpecialItem = specialItemItem;

  // PUT /:contractId/special-items/:itemId — updateContractSpecialItem
  static updateSpecialItem = specialItemItem;
}
