import { describe, it, expect, vi, beforeAll } from "vitest";

// A valid 1x1 transparent PNG — returned for every image fetch so the drawing
// pipeline (background / intro / stamp / signature) exercises embedPng end-to-end.
const PNG_1x1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64",
);

vi.mock("../../../infra/prisma/prisma.js", () => ({
  default: {
    siteUtility: { findFirst: vi.fn().mockResolvedValue(null) },
  },
}));

vi.mock("../../../infra/pdf/pdf-helpers.js", async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, fetchImageBuffer: vi.fn().mockResolvedValue(PNG_1x1) };
});

let generateImageSessionPdf;
beforeAll(async () => {
  ({ generateImageSessionPdf } = await import(
    "../services/generate-image-session-pdf.js"
  ));
});

describe("generateImageSessionPdf (structural smoke)", () => {
  it("produces a valid PDF with the SiteUtility asset pipeline (banner removed)", async () => {
    const bytes = await generateImageSessionPdf({
      sessionData: {},
      signatureUrl: "/uploads/client-sig.png",
      lng: "en",
      name: "Test Client",
    });
    expect(bytes).toBeInstanceOf(Uint8Array);
    // PDF magic header "%PDF"
    expect(Buffer.from(bytes.slice(0, 4)).toString()).toBe("%PDF");
    expect(bytes.length).toBeGreaterThan(1000);
  });
});
