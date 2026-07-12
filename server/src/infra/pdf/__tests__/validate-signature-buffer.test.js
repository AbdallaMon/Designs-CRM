import { describe, it, expect } from "vitest";
import sharp from "sharp";
import { validateSignatureBuffer } from "../pdf-helpers.js";

// Build a PNG with a solid-color content block of `content` px centered in a
// transparent canvas of `canvas` px. When canvas > content there are transparent
// margins, so it is NOT cropped tight.
async function makePng({ canvas, content }) {
  const pad = Math.floor((canvas - content) / 2);
  const block = await sharp({
    create: {
      width: content,
      height: content,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 1 },
    },
  })
    .png()
    .toBuffer();

  return sharp({
    create: {
      width: canvas,
      height: canvas,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: block, left: pad, top: pad }])
    .png()
    .toBuffer();
}

async function makeJpg({ size }) {
  return sharp({
    create: {
      width: size,
      height: size,
      channels: 3,
      background: { r: 10, g: 20, b: 30 },
    },
  })
    .jpeg()
    .toBuffer();
}

describe("validateSignatureBuffer", () => {
  it("accepts a PNG cropped tight to its content", async () => {
    const buf = await makePng({ canvas: 100, content: 100 });
    expect(await validateSignatureBuffer(buf)).toBeNull();
  });

  it("rejects a non-PNG (JPEG) image", async () => {
    const buf = await makeJpg({ size: 100 });
    expect(await validateSignatureBuffer(buf)).toBe("SIGNATURE_MUST_BE_PNG");
  });

  it("rejects a PNG with excess transparent margins (not cropped)", async () => {
    const buf = await makePng({ canvas: 200, content: 100 });
    expect(await validateSignatureBuffer(buf)).toBe(
      "SIGNATURE_MUST_BE_CROPPED",
    );
  });
});
