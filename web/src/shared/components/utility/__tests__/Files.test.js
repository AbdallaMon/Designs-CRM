import { describe, expect, it } from "vitest";
import { getFileName, getFileType } from "../Files.jsx";

describe("file presentation", () => {
  it("recognizes signed image and PDF URLs without treating query strings as extensions", () => {
    expect(
      getFileType(
        "https://api.example.test/v2/files/content/leads/photo.jpg?expires=1&signature=x",
      ),
    ).toBe("image");
    expect(
      getFileType(
        "https://api.example.test/v2/files/content/contracts/agreement.pdf?expires=1&signature=x",
      ),
    ).toBe("pdf");
  });

  it("uses the record filename when a stable attachment URL has no extension", () => {
    const url = "https://api.example.test/v2/files/attachments/lead-file/21";
    expect(getFileType(url, "drawing.png")).toBe("image");
    expect(getFileName({ url, name: "drawing.png" })).toBe("drawing.png");
  });
});
