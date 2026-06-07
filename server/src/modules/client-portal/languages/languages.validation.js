// client-portal/languages validation — the PUBLIC languages lookup query.
import { z } from "zod";

export const LanguagesValidation = {
  // GET /languages?notArchived=true — legacy treated the string "true" as the boolean.
  listQuery: z
    .object({
      notArchived: z
        .enum(["true", "false"])
        .optional()
        .transform((v) => v === "true"),
    })
    .strip(),
};
