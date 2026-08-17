import { describe, expect, it } from "vitest";
import { normalizeStoredValue } from "../scripts/normalize-upload-references.mjs";

describe("upload reference database normalization", () => {
  const options = { allowAnyOrigin: true };

  it("normalizes exact legacy URL and filesystem values", () => {
    expect(
      normalizeStoredValue("https://dreamstudiio.com/uploads/contracts/a.pdf", options),
    ).toBe("/uploads/contracts/a.pdf");
    expect(
      normalizeStoredValue(
        "/home/dreamstudiio.com/public_html/uploads/image-sessions/a.png",
        options,
      ),
    ).toBe("/uploads/image-sessions/a.png");
  });

  it("rewrites embedded absolute upload URLs without corrupting surrounding text", () => {
    expect(
      normalizeStoredValue(
        '<p>Open <a href="https://dreamstudiio.com/uploads/contracts/a.pdf">contract</a>.</p>',
        options,
      ),
    ).toBe('<p>Open <a href="/uploads/contracts/a.pdf">contract</a>.</p>');
    expect(
      normalizeStoredValue("See https://dreamstudiio.com/uploads/a.pdf, then reply.", options),
    ).toBe("See /uploads/a.pdf, then reply.");
  });

  it("walks JSON values and leaves unrelated URLs and prose unchanged", () => {
    expect(
      normalizeStoredValue(
        {
          files: ["https://old.example/uploads/a.png", "/uploads/b.png"],
          note: "See /uploads/b.png in this note",
          website: "https://example.com/page",
        },
        options,
      ),
    ).toEqual({
      files: ["/uploads/a.png", "/uploads/b.png"],
      note: "See /uploads/b.png in this note",
      website: "https://example.com/page",
    });
  });
});
