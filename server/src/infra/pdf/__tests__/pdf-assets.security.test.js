import { describe, expect, it } from "vitest";
import { fetchImageBuffer } from "../pdf-helpers.js";

describe("PDF asset loading security", () => {
  it.each([
    "http://127.0.0.1/internal.png",
    "http://169.254.169.254/latest/meta-data",
    "https://user:password@dreamstudiio.com/uploads/a.png",
    "https://evil.example/uploads/a.png",
  ])("rejects an untrusted server-side image URL before fetching: %s", async (url) => {
    await expect(fetchImageBuffer(url, { retries: 1 })).rejects.toThrow(
      /Remote asset origin is not trusted/,
    );
  });
});
