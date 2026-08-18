import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { env } from "../../../config/env.js";
import {
  buildAuthenticatedAttachmentUrl,
  buildAssetAccessUrl,
  exposeAssetReferences,
  verifyAssetAccess,
} from "../asset-access.js";
import {
  canonicalizeAssetReferences,
  normalizeUploadReference,
  storageKeyFromUploadReference,
} from "../upload-reference.js";

const ORIGINAL_ENV = {
  ASSET_URL_SIGNING_SECRET: env.ASSET_URL_SIGNING_SECRET,
  ASSET_DELIVERY_ORIGIN: env.ASSET_DELIVERY_ORIGIN,
  SERVER_URL: env.SERVER_URL,
  ASSET_URL_TTL_SECONDS: env.ASSET_URL_TTL_SECONDS,
  ASSET_URL_MAX_TTL_SECONDS: env.ASSET_URL_MAX_TTL_SECONDS,
  UPLOAD_LEGACY_ORIGINS: env.UPLOAD_LEGACY_ORIGINS,
};

describe("private asset access", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-17T10:00:00.000Z"));
    env.ASSET_URL_SIGNING_SECRET = "test-only-independent-asset-signing-secret";
    env.ASSET_DELIVERY_ORIGIN = "https://api.example.test";
    env.SERVER_URL = "https://server.example.test";
    env.ASSET_URL_TTL_SECONDS = 60;
    env.ASSET_URL_MAX_TTL_SECONDS = 3600;
    env.UPLOAD_LEGACY_ORIGINS = "https://dreamstudiio.com";
  });

  afterEach(() => {
    Object.assign(env, ORIGINAL_ENV);
    vi.useRealTimers();
  });

  it("signs canonical references and rejects tampering, expiry, and excessive lifetime", () => {
    const url = new URL(buildAssetAccessUrl("/uploads/contracts/client file.pdf"));
    const storageKey = decodeURIComponent(
      url.pathname.slice("/v2/files/content/".length),
    );
    const expires = Number(url.searchParams.get("expires"));
    const signature = url.searchParams.get("signature");

    expect(url.origin).toBe("https://api.example.test");
    expect(storageKey).toBe("contracts/client file.pdf");
    expect(
      verifyAssetAccess({ storageKey, expires, signature }),
    ).toEqual({ storageKey, expires });
    expect(verifyAssetAccess({ storageKey: `${storageKey}.x`, expires, signature })).toBeNull();
    expect(verifyAssetAccess({ storageKey, expires, signature: `${signature}x` })).toBeNull();

    vi.setSystemTime(new Date("2026-08-17T10:01:01.000Z"));
    expect(verifyAssetAccess({ storageKey, expires, signature })).toBeNull();
    expect(
      verifyAssetAccess({
        storageKey,
        expires: Math.floor(Date.now() / 1000) + 3601,
        signature,
      }),
    ).toBeNull();
  });

  it("builds durable authenticated links on the API server without expiry", () => {
    const url = buildAuthenticatedAttachmentUrl({ type: "lead-file", id: 21 });
    expect(url).toBe(
      "https://server.example.test/v2/files/attachments/lead-file/21",
    );
    expect(url).not.toContain("expires=");
    expect(url).not.toContain("signature=");
  });

  it("normalizes only valid upload references and rejects traversal", () => {
    expect(normalizeUploadReference("https://dreamstudiio.com/uploads/a/b.png")).toBe(
      "/uploads/a/b.png",
    );
    expect(normalizeUploadReference("/home/dreamstudiio.com/public_html/uploads/a.pdf")).toBe(
      "/uploads/a.pdf",
    );
    expect(normalizeUploadReference("https://evil.test/uploads/a.pdf")).toBeNull();
    expect(normalizeUploadReference("/uploads/a/../secret.txt")).toBeNull();
    expect(normalizeUploadReference("/uploads/a%5c..%5csecret.txt")).toBeNull();
    expect(storageKeyFromUploadReference("/uploads/a%2Fb.png")).toBe("a/b.png");
    expect(normalizeUploadReference("See /uploads/a.pdf in this note")).toBeNull();
    expect(
      normalizeUploadReference("See /home/site/public_html/uploads/a.pdf in this note"),
    ).toBeNull();
    expect(
      normalizeUploadReference("https://evil.test/v2/files/content/contracts/a.pdf"),
    ).toBeNull();
    expect(
      normalizeUploadReference(
        "/v2/files/content/contracts/a.pdf?expires=1&signature=test",
      ),
    ).toBe("/uploads/contracts/a.pdf");
  });

  it("exposes nested response references but canonicalizes signed request values", () => {
    const exposed = exposeAssetReferences({
      attachment: "/uploads/chat/photo.png",
      untouched: "hello",
      nested: ["/uploads/contracts/a.pdf"],
    });
    expect(exposed.attachment).toContain("/v2/files/content/chat/photo.png?");
    expect(exposed.untouched).toBe("hello");
    expect(canonicalizeAssetReferences(exposed)).toEqual({
      attachment: "/uploads/chat/photo.png",
      untouched: "hello",
      nested: ["/uploads/contracts/a.pdf"],
    });
  });

  it("signs and round-trips asset references embedded in notes and HTML", () => {
    const original = {
      note:
        'See /uploads/contracts/a.pdf, then <img src="https://dreamstudiio.com/uploads/chat/b.png">.',
    };
    const exposed = exposeAssetReferences(original);

    expect(exposed.note).toContain("/v2/files/content/contracts/a.pdf?");
    expect(exposed.note).toContain("/v2/files/content/chat/b.png?");
    expect(exposed.note).toContain(", then <img src=");
    expect(canonicalizeAssetReferences(exposed)).toEqual({
      note:
        'See /uploads/contracts/a.pdf, then <img src="/uploads/chat/b.png">.',
    });
  });

  it("fails closed when a production placeholder secret is left configured", () => {
    env.ASSET_URL_SIGNING_SECRET = "REPLACE_WITH_SECRET";
    expect(() => buildAssetAccessUrl("/uploads/a.pdf")).toThrow(
      "ASSET_URL_SIGNING_SECRET is required",
    );
    env.ASSET_URL_SIGNING_SECRET = "too-short";
    expect(() => buildAssetAccessUrl("/uploads/a.pdf")).toThrow(
      "ASSET_URL_SIGNING_SECRET is required",
    );
  });
});
