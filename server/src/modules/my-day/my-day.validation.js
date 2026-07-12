// my-day Zod schemas. Params only — every endpoint is a read.
import { z } from "zod";

export class MyDayValidation {
  // GET /v2/my-day/users/:userId — drill-down target.
  static userIdParams = z.object({
    userId: z.coerce.number().int().positive(),
  });
}
