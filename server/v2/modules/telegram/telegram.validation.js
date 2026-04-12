import { z } from "zod";
import { TELEGRAM_CONSTANTS } from "./telegram.constant.js";

const EGYPT_OR_UAE_PHONE_REGEX = /^(\+20(10|11|12|15)\d{8}|\+9715\d{8})$/;
const phoneNumberSchema = z.string().trim().regex(EGYPT_OR_UAE_PHONE_REGEX, {
  error:
    "Phone number must be a valid Egypt or UAE mobile in international format",
});

const codeSchema = z.string().trim().min(1, { error: "Code is required" });

const passwordSchema = z.string().min(1, { error: "Password is required" });

const initSchema = z
  .object({
    state: z.undefined().optional(),
    phoneNumber: phoneNumberSchema,
  })
  .strict();

const awaitCodeSchema = z
  .object({
    state: z.literal(TELEGRAM_CONSTANTS.STATUS.awaitCode),
    phoneNumber: phoneNumberSchema,
    code: codeSchema,
  })
  .strict();

const awaitPasswordSchema = z
  .object({
    state: z.literal(TELEGRAM_CONSTANTS.STATUS.awaitPassword),
    password: passwordSchema,
  })
  .strict();

const explicitInitSchema = z
  .object({
    state: z.literal(TELEGRAM_CONSTANTS.STATUS.init),
    phoneNumber: phoneNumberSchema,
  })
  .strict();

export const telegramSessionSchema = z.union([
  initSchema,
  explicitInitSchema,
  awaitCodeSchema,
  awaitPasswordSchema,
]);
