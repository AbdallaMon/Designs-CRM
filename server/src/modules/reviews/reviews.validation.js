// reviews validation — Zod query schemas. These are GET endpoints with no mutating body;
// the query params are optional strings (the legacy service tolerated undefined). Failures
// auto-return 422 + details. No `.strict()` body — there is no body to mass-assign.
import { z } from "zod";

export class ReviewsValidation {
  static oauthCallbackQuery = z.object({
    code: z.string().min(1).optional(),
    // Google appends scope/state on the redirect; tolerate extra params.
  }).passthrough();

  static locationsQuery = z.object({
    code: z.string().optional(),
  }).passthrough();

  static reviewsQuery = z.object({
    accountId: z.string().optional(),
    locationId: z.string().optional(),
  }).passthrough();
}
