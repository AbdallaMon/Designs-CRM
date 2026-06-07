// accounting/rent Zod schemas. Money amount coerced POSITIVE (no NaN / <= 0). The
// legacy createARent / renewRentAndMakeOutCome also require name + the date fields
// (preserved as service-side checks); we assert the essentials at the edge too.
import { z } from "zod";

const idParam = z.coerce.number().int().positive();

const positiveAmount = z.coerce.number().refine((n) => Number.isFinite(n) && n > 0, {
  message: "amount must be a positive number",
});

export class RentValidation {
  static rentIdParams = z.object({ rentId: idParam });

  static listQuery = z.object({}).passthrough();

  // POST /rents — legacy createARent({name,amount,description,startDate,endDate,paymentDate})
  static create = z
    .object({
      name: z.string().min(1),
      amount: positiveAmount,
      description: z.string().nullish(),
      startDate: z.union([z.string().min(1), z.date()]),
      endDate: z.union([z.string().min(1), z.date()]),
      paymentDate: z.union([z.string().min(1), z.date()]),
    })
    .strict();

  // PUT /rents/:rentId — legacy renewRentAndMakeOutCome (renew + create outcome). paymentDate
  // is read by the service for the outcome createdAt; required-fields are name/amount/dates.
  static renew = z
    .object({
      name: z.string().nullish(),
      amount: positiveAmount,
      startDate: z.union([z.string().min(1), z.date()]),
      endDate: z.union([z.string().min(1), z.date()]),
      paymentDate: z.union([z.string().min(1), z.date()]).nullish(),
    })
    .strict();
}
