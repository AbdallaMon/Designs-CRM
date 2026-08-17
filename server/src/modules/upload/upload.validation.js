import { z } from "zod";
import { PUBLIC_UPLOAD_PURPOSES, generalMessagesCodes } from "@dms/shared";

const optionalFolder = z.string().trim().optional().default("");
const booleanFromMultipart = z.preprocess((value) => {
  if (typeof value === "string") {
    const normalizedValue = value.trim().toLowerCase();
    if (normalizedValue === "true") return true;
    if (normalizedValue === "false") return false;
  }

  return value;
}, z.boolean().optional().default(true));

class UploadSchemas {
  contentAccessQuery = z
    .object({
      expires: z.coerce.number().int().positive(),
      signature: z.string().trim().min(32).max(128).regex(/^[A-Za-z0-9_-]+$/),
    })
    .strict();

  publicCapability = z
    .object({
      purpose: z.literal(PUBLIC_UPLOAD_PURPOSES.PUBLIC_LEAD),
      funnelToken: z.string().trim().min(1).max(4096),
    })
    .strict();

  publicAccessQuery = z
    .object({
      purpose: z.enum([
        PUBLIC_UPLOAD_PURPOSES.CONTRACT,
        PUBLIC_UPLOAD_PURPOSES.IMAGE_SESSION,
        PUBLIC_UPLOAD_PURPOSES.CHAT,
        PUBLIC_UPLOAD_PURPOSES.CALENDAR,
        PUBLIC_UPLOAD_PURPOSES.PUBLIC_LEAD,
      ]),
    })
    .strict();

  singleFile = z.object({
    folder: optionalFolder,
    createThumbnail: booleanFromMultipart,
  });

  chunkUpload = z
    .object({
      filename: z
        .string()
        .trim()
        .min(1, generalMessagesCodes.FILE_REQUIRED)
        .max(255),
      chunkIndex: z.coerce
        .number()
        .int()
        .min(0, generalMessagesCodes.CHUNK_INDEX_INVALID),
      totalChunks: z.coerce
        .number()
        .int()
        .positive(generalMessagesCodes.TOTAL_CHUNKS_INVALID)
        .max(1024, generalMessagesCodes.TOTAL_CHUNKS_EXCEEDED),
      uploadSessionId: z.string().trim().max(255).optional(),
      folder: optionalFolder,
      createThumbnail: booleanFromMultipart,
    })
    .strict()
    .refine((body) => body.chunkIndex < body.totalChunks, {
      message: generalMessagesCodes.CHUNK_INDEX_OUT_OF_RANGE,
      path: ["chunkIndex"],
    });
}

export const uploadSchemas = new UploadSchemas();
