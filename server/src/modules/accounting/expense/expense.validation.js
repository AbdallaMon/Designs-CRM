// accounting/expense Zod schemas. Money amount coerced POSITIVE (no NaN / <= 0). The
// legacy createOperationalExpense also requires category + paymentDate (preserved as a
// service-side check); we assert them at the edge too. `validate(...)` returns 422.
import { z } from "zod";

const positiveAmount = z.coerce.number().refine((n) => Number.isFinite(n) && n > 0, {
  message: "amount must be a positive number",
});

export class ExpenseValidation {
  static listQuery = z.object({}).passthrough();

  // POST /operational-expenses — legacy createOperationalExpense({category,amount,description,paymentDate})
  static create = z
    .object({
      category: z.string().min(1),
      amount: positiveAmount,
      description: z.string().nullish(),
      paymentDate: z.union([z.string().min(1), z.date()]),
    })
    .strict();
}
