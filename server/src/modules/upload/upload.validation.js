import { z } from "zod";

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
  publicCapability = z
    .object({
      purpose: z.literal("PUBLIC_LEAD"),
      subject: z.string().trim().email().max(255),
    })
    .strict();

  publicAccessQuery = z
    .object({
      purpose: z.enum([
        "CONTRACT",
        "IMAGE_SESSION",
        "CHAT",
        "CALENDAR",
        "PUBLIC_LEAD",
      ]),
    })
    .strict();

  singleFile = z.object({
    folder: optionalFolder,
    createThumbnail: booleanFromMultipart,
  });

  chunkUpload = z.object({
    filename: z.string().trim().min(1, "filename is required"),
    chunkIndex: z.coerce
      .number()
      .int()
      .min(0, "chunkIndex must be 0 or greater"),
    totalChunks: z.coerce
      .number()
      .int()
      .positive("totalChunks must be greater than 0"),
    uploadSessionId: z.string().trim().optional(),
    folder: optionalFolder,
    createThumbnail: booleanFromMultipart,
  }).strict();
}

export const uploadSchemas = new UploadSchemas();
