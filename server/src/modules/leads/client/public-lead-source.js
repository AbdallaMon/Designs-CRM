import { z } from "zod";

export const DEFAULT_PUBLIC_LEAD_SOURCE = "https://booking.ahmadmobayed.com";

export function normalizePublicLeadSource(value) {
  const url = new URL(value);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("INVALID_PUBLIC_LEAD_SOURCE_PROTOCOL");
  }
  return url.origin;
}

export const publicLeadSourceSchema = z
  .string()
  .trim()
  .max(255)
  .refine((value) => {
    try {
      normalizePublicLeadSource(value);
      return true;
    } catch {
      return false;
    }
  }, "INVALID_PUBLIC_LEAD_SOURCE")
  .transform(normalizePublicLeadSource);

