import { beforeEach, describe, expect, it, vi } from "vitest";
import sharp from "sharp";

vi.mock("../upload.repo.js", () => ({
  uploadRepository: {
    findPublicLeadDraftById: vi.fn(),
    findContractByToken: vi.fn(),
    findImageSessionByToken: vi.fn(),
    findChatRoomByToken: vi.fn(),
    findCalendarSessionByToken: vi.fn(),
  },
}));

import { uploadRepository } from "../upload.repo.js";
import { UploadUsecase } from "../upload.usecase.js";
import { uploadController } from "../upload.controller.js";
import { uploadUsecase } from "../upload.usecase.js";
import { uploadRouter } from "../upload.route.js";
import { LocalStorageProvider } from "../../../infra/upload/local-disk-storage.provider.js";
import { uploadSchemas } from "../upload.validation.js";
import {
  assertChunkUploadBounds,
  validatePublicUploadContent,
} from "../upload.security.js";
import {
  issuePublicFunnelCapability,
  PUBLIC_FUNNEL_PURPOSES,
} from "../../../infra/upload/public-funnel-capability.js";
import { env } from "../../../config/env.js";

env.JWT_UPLOAD_SECRET = "upload-capability-test-secret";

describe("public upload capability exchange", () => {
  const usecase = new UploadUsecase();

  beforeEach(() => {
    vi.clearAllMocks();
    uploadRepository.findPublicLeadDraftById.mockResolvedValue({ id: 91 });
  });

  it("rejects arbitrary email-based capability issuance", async () => {
    expect(
      uploadSchemas.publicCapability.safeParse({ purpose: "PUBLIC_LEAD", subject: "a@b.com" }).success,
    ).toBe(false);
    await expect(
      usecase.issuePublicCapability({ purpose: "PUBLIC_LEAD", funnelToken: "not-a-token" }),
    ).rejects.toMatchObject({ code: "INVALID_TOKEN", statusCode: 401 });
  });

  it("exchanges only a verified register-draft token", async () => {
    const funnel = issuePublicFunnelCapability({
      purpose: PUBLIC_FUNNEL_PURPOSES.PUBLIC_REGISTER,
      leadId: 91,
    });
    const capability = await usecase.issuePublicCapability({
      purpose: "PUBLIC_LEAD",
      funnelToken: funnel.token,
    });
    expect(capability).toMatchObject({ purpose: "PUBLIC_LEAD", token: expect.any(String) });
    await expect(
      usecase.authorizePublicUpload({ purpose: "PUBLIC_LEAD", token: capability.token }),
    ).resolves.toMatchObject({ subject: "91", namespace: "PUBLIC_LEAD:91" });
  });
});

describe("public upload content policy", () => {
  async function image(format) {
    return sharp({
      create: { width: 2, height: 2, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 1 } },
    })
      .toFormat(format)
      .toBuffer();
  }

  it.each([
    ["CONTRACT", "png", "signature.png", "image/png"],
    ["CONTRACT", "jpeg", "signature.jpg", "image/jpeg"],
    ["CONTRACT", "webp", "signature.webp", "image/webp"],
    ["IMAGE_SESSION", "png", "signature.png", "image/png"],
    ["IMAGE_SESSION", "jpeg", "signature.jpg", "image/jpeg"],
    ["IMAGE_SESSION", "webp", "signature.webp", "image/webp"],
  ])("accepts a valid %s %s signature image", async (purpose, format, filename, mime) => {
    await expect(
      validatePublicUploadContent({
        purpose,
        originalName: filename,
        declaredMime: mime,
        buffer: await image(format),
      }),
    ).resolves.toMatchObject({ mime });
  });

  it("serves authorized signed content with private cache and safe headers", async () => {
    expect(uploadRouter).toBeTruthy();
    const expires = Math.floor(Date.now() / 1000) + 60;
    const scoped = {
      finalPath: "C:/safe/document.pdf",
      filename: "document.pdf",
      fileMimeType: "application/pdf",
      expires,
    };
    const headers = {};
    const response = {
      setHeader: vi.fn((name, value) => {
        headers[name] = value;
      }),
      sendFile: vi.fn((_path, callback) => callback()),
    };

    await uploadController.serveContent({ scoped }, response);
    expect(headers).toMatchObject({
      "X-Content-Type-Options": "nosniff",
      "Content-Disposition": 'inline; filename="document.pdf"',
      "Content-Security-Policy": "sandbox; default-src 'none'",
      "Cache-Control": "private, max-age=60",
      "Referrer-Policy": "no-referrer",
    });
    expect(response.sendFile).toHaveBeenCalledWith(scoped.finalPath, expect.any(Function));
  });

  it("does not expose a public storage key", async () => {
    const buffer = await image("png");
    const save = vi.spyOn(LocalStorageProvider, "saveBuffer").mockResolvedValue({
      storageKey: "private/random.png",
      fileUrl: "/uploads/private/random.png",
      thumbnailUrl: null,
      thumbnailKey: null,
      fileMimeType: "image/png",
      fileSize: buffer.length,
      finalPath: "C:/safe/random.png",
    });
    const result = await new UploadUsecase().uploadSingleFile({
      purpose: "CONTRACT",
      file: { buffer, originalname: "signature.png", mimetype: "image/png" },
    });
    expect(result).not.toHaveProperty("storageKey");
    expect(result.url).toBe("/uploads/private/random.png");
    save.mockRestore();
  });

  it.each([
    ["page.html", "text/html", Buffer.from("<!doctype html><script>alert(1)</script>")],
    ["vector.svg", "image/svg+xml", Buffer.from("<svg onload='alert(1)'/>")],
    ["program.exe", "application/octet-stream", Buffer.from("MZ executable")],
  ])("rejects unsafe public upload %s", async (filename, mime, buffer) => {
    await expect(
      validatePublicUploadContent({
        purpose: "PUBLIC_LEAD",
        originalName: filename,
        declaredMime: mime,
        buffer,
      }),
    ).rejects.toMatchObject({ code: "FILE_UPLOAD_ERROR", statusCode: 422 });
  });

  it("rejects excessive chunks and aggregate public bytes", () => {
    expect(() =>
      assertChunkUploadBounds({ purpose: "PUBLIC_LEAD", totalChunks: 101, totalBytes: 1 }),
    ).toThrow(expect.objectContaining({ code: "FILE_UPLOAD_ERROR" }));
    expect(() =>
      assertChunkUploadBounds({
        purpose: "PUBLIC_LEAD",
        totalChunks: 25,
        totalBytes: 25 * 1024 * 1024 + 1,
      }),
    ).toThrow(expect.objectContaining({ code: "FILE_UPLOAD_ERROR" }));
    expect(
      uploadSchemas.chunkUpload.safeParse({
        filename: "x.png",
        chunkIndex: 0,
        totalChunks: 1025,
      }).success,
    ).toBe(false);
  });
});
