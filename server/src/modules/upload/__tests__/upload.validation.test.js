import { describe, expect, it } from "vitest";
import { uploadSchemas } from "../upload.validation.js";

describe("upload validation message contract", () => {
  it("uses language-neutral codes for invalid chunk metadata", () => {
    const result = uploadSchemas.chunkUpload.safeParse({
      filename: "",
      chunkIndex: -1,
      totalChunks: 0,
    });

    expect(result.success).toBe(false);
    expect(result.error.issues.map((issue) => issue.message)).toEqual(
      expect.arrayContaining([
        "FILE_REQUIRED",
        "CHUNK_INDEX_INVALID",
        "TOTAL_CHUNKS_INVALID",
      ]),
    );
  });

  it("returns a code when the chunk index exceeds the declared chunk count", () => {
    const result = uploadSchemas.chunkUpload.safeParse({
      filename: "design.pdf",
      chunkIndex: 2,
      totalChunks: 2,
    });

    expect(result.success).toBe(false);
    expect(result.error.issues[0].message).toBe("CHUNK_INDEX_OUT_OF_RANGE");
  });
});
