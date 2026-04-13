import { z } from "zod";

const EGYPT_OR_UAE_PHONE_REGEX = /^(\+20(10|11|12|15)\d{8}|\+9715\d{8})$/;
const phoneNumberSchema = z.string().trim().regex(EGYPT_OR_UAE_PHONE_REGEX, {
  error: "Phone number must be a valid UAE mobile in international format",
});

const codeSchema = z.string().trim().min(1, { error: "Code is required" });

const passwordSchema = z.string().min(1, { error: "Password is required" });

export const initSchema = z.object({
  phoneNumber: phoneNumberSchema,
});

export const awaitCodeSchema = z.object({
  phoneNumber: phoneNumberSchema,
  code: codeSchema,
});

export const awaitPasswordSchema = z.object({
  password: passwordSchema,
});
