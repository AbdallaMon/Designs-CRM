import { validationMessagesCodes as V } from "@dms/shared";
import { z } from "zod";

const EGYPT_OR_UAE_PHONE_REGEX = /^(\+20(10|11|12|15)\d{8}|\+9715\d{8})$/;
const phoneNumberSchema = z.string().trim().regex(EGYPT_OR_UAE_PHONE_REGEX, {
  error: V.INVALID_UAE_PHONE_NUMBER,
});

const codeSchema = z.string().trim().min(1, { error: V.FIELD_REQUIRED });

const passwordSchema = z.string().min(1, { error: V.FIELD_REQUIRED });

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
