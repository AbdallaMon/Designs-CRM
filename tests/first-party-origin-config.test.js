import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { buildBrandAssetUrl } from "../server/src/shared/brand.js";
import { resolveWebOrigin } from "../web/src/app/helpers/public-origin.js";

const SOURCE_ROOTS = ["server/src", "web/src", "courses-web/src"];
const SOURCE_EXTENSION = /\.(?:js|jsx|mjs)$/u;

function sourceFiles(root) {
  return fs.readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      return entry.name === "__tests__" ? [] : sourceFiles(fullPath);
    }
    if (!SOURCE_EXTENSION.test(entry.name) || /\.test\./u.test(entry.name)) return [];
    return [fullPath];
  });
}

describe("first-party public origins", () => {
  it("builds server email assets from CRM_DOMAIN-compatible origins", () => {
    expect(
      buildBrandAssetUrl("/main-logo.jpg", "https://crm.dreamstudiio.com/"),
    ).toBe("https://crm.dreamstudiio.com/main-logo.jpg");
  });

  it("prefers the explicit web origin and supports the legacy protocol/host pair", () => {
    expect(
      resolveWebOrigin({
        webUrl: "https://crm.dreamstudiio.com/path-that-must-be-ignored",
        protocol: "http",
        host: "wrong.example",
      }),
    ).toBe("https://crm.dreamstudiio.com");
    expect(
      resolveWebOrigin({ protocol: "https", host: "crm.dreamstudiio.com" }),
    ).toBe("https://crm.dreamstudiio.com");
  });

  it("contains no hard-coded legacy Dream Studio origin in live application source", () => {
    const offenders = SOURCE_ROOTS.flatMap(sourceFiles).filter((file) =>
      /https?:\/\/(?:www\.|panel\.)?dreamstudiio\.com/iu.test(
        fs.readFileSync(file, "utf8"),
      ),
    );
    expect(offenders).toEqual([]);
  });
});
