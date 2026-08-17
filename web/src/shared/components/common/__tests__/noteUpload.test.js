import { describe, expect, it } from "vitest";
import { PUBLIC_UPLOAD_PURPOSES } from "@dms/shared";
import {
  buildNoteUploadOptions,
  resolveNoteAttachmentReference,
} from "../noteUpload.js";

describe("client note uploads", () => {
  it("uses the image-session token-scoped public upload contract", () => {
    expect(buildNoteUploadOptions({ slug: "client", token: "session-token" })).toEqual({
      publicAccess: {
        purpose: PUBLIC_UPLOAD_PURPOSES.IMAGE_SESSION,
        token: "session-token",
      },
    });
  });

  it("stores the canonical upload reference instead of an expiring access URL", () => {
    expect(resolveNoteAttachmentReference({
      storageUrl: "/uploads/public/image-session/1/note.png",
      url: "https://example.test/v2/files/content/note.png?signature=temporary",
    })).toBe("/uploads/public/image-session/1/note.png");
  });
});
