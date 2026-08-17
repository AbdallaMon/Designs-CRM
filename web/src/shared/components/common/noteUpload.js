import { PUBLIC_UPLOAD_PURPOSES } from "@dms/shared";

export function buildNoteUploadOptions({ slug, token }) {
  if (slug !== "client") return undefined;
  return {
    publicAccess: {
      purpose: PUBLIC_UPLOAD_PURPOSES.IMAGE_SESSION,
      token,
    },
  };
}

export function resolveNoteAttachmentReference(upload) {
  return upload.storageUrl || upload.url;
}
