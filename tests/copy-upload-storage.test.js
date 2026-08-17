import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { copyUploadStorage } from "../scripts/copy-upload-storage.mjs";

const cleanup = [];

async function tempDirectory(prefix) {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), prefix));
  cleanup.push(directory);
  return directory;
}

afterEach(async () => {
  await Promise.all(
    cleanup.splice(0).map((directory) =>
      fs.rm(directory, { recursive: true, force: true }),
    ),
  );
});

describe("upload storage copy", () => {
  it("dry-runs, copies with verification, and is idempotent", async () => {
    const source = await tempDirectory("dream-uploads-source-");
    const target = await tempDirectory("dream-uploads-target-");
    await fs.mkdir(path.join(source, "contracts"));
    await fs.writeFile(path.join(source, "contracts", "a.pdf"), "pdf-content");
    await fs.writeFile(path.join(source, "photo.png"), "image-content");

    await expect(copyUploadStorage({ source, target })).resolves.toMatchObject({
      mode: "dry-run",
      files: 2,
      pending: 2,
      copied: 0,
    });
    await expect(copyUploadStorage({ source, target, apply: true })).resolves.toMatchObject({
      mode: "apply",
      files: 2,
      copied: 2,
      conflicts: [],
    });
    await expect(copyUploadStorage({ source, target })).resolves.toMatchObject({
      pending: 0,
      identical: 2,
      conflicts: [],
    });
    await expect(fs.readFile(path.join(target, "contracts", "a.pdf"), "utf8")).resolves.toBe(
      "pdf-content",
    );
  });

  it("reports a conflict and never overwrites the target", async () => {
    const source = await tempDirectory("dream-uploads-source-");
    const target = await tempDirectory("dream-uploads-target-");
    await fs.writeFile(path.join(source, "same.png"), "old");
    await fs.writeFile(path.join(target, "same.png"), "different");

    await expect(copyUploadStorage({ source, target, apply: true })).rejects.toThrow(
      "target conflict",
    );
    await expect(fs.readFile(path.join(target, "same.png"), "utf8")).resolves.toBe(
      "different",
    );
  });

  it("rejects a target inside the repository", async () => {
    const source = await tempDirectory("dream-uploads-source-");
    await expect(
      copyUploadStorage({ source, target: path.join(process.cwd(), ".unsafe-storage") }),
    ).rejects.toThrow("outside the repository");
  });
});
