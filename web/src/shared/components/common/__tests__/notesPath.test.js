import { describe, expect, it } from "vitest";
import { getNotesPath } from "../notesPath.js";

describe("getNotesPath", () => {
  it("maps the legacy shared slug to the canonical authenticated notes route", () => {
    expect(getNotesPath("shared")).toBe("notes");
  });

  it("preserves dedicated client and accounting note routes", () => {
    expect(getNotesPath("client")).toBe("client/notes");
    expect(getNotesPath("accountant")).toBe("accounting/notes");
    expect(getNotesPath("accounting")).toBe("accounting/notes");
  });
});
