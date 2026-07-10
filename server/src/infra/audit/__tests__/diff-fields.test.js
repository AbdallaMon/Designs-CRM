import { describe, it, expect } from "vitest";
import { diffFields } from "../diff-fields.js";

describe("diffFields", () => {
  it("returns ONLY the changed keys (unchanged omitted)", () => {
    const before = { name: "Ann", status: "NEW", note: "same" };
    const after = { name: "Anna", status: "IN_PROGRESS", note: "same" };
    const { changed, before: b, after: a } = diffFields(before, after);
    expect(changed.sort()).toEqual(["name", "status"]);
    expect(b).toEqual({ name: "Ann", status: "NEW" });
    expect(a).toEqual({ name: "Anna", status: "IN_PROGRESS" });
    expect("note" in b).toBe(false);
  });

  it("treats deep-equal values (arrays/objects) as unchanged", () => {
    const { changed } = diffFields(
      { tags: [1, 2], meta: { a: 1 } },
      { tags: [1, 2], meta: { a: 1 } },
    );
    expect(changed).toEqual([]);
  });

  it("redacts sensitive keys in BOTH before and after", () => {
    const before = { password: "old", token: "t1", arToken: "a1", name: "x" };
    const after = { password: "new", token: "t2", arToken: "a2", name: "y" };
    const { changed, before: b, after: a } = diffFields(before, after);
    expect(changed.sort()).toEqual(["arToken", "name", "password", "token"]);
    expect(b.password).toBe("[redacted]");
    expect(a.password).toBe("[redacted]");
    expect(b.token).toBe("[redacted]");
    expect(a.arToken).toBe("[redacted]");
    expect(b.name).toBe("x"); // non-sensitive passes through
    expect(a.name).toBe("y");
  });

  it("redacts the full sensitive deny-list", () => {
    const keys = [
      "password", "passwordHash", "token", "arToken", "enToken", "chatAccessToken",
      "sessionString", "apiHash", "refreshToken", "accessToken", "access_token", "refresh_token",
    ];
    for (const k of keys) {
      const { after } = diffFields({ [k]: "a" }, { [k]: "b" });
      expect(after[k]).toBe("[redacted]");
    }
  });

  it("restricts the diff scope to allowedKeys when provided", () => {
    const before = { name: "a", secretField: "x", role: "STAFF" };
    const after = { name: "b", secretField: "y", role: "ADMIN" };
    const { changed } = diffFields(before, after, ["name", "role"]);
    expect(changed.sort()).toEqual(["name", "role"]);
    expect(changed).not.toContain("secretField");
  });

  it("treats a null/undefined before as all-after-keys added", () => {
    const after = { id: 5, name: "new" };
    const r1 = diffFields(null, after);
    const r2 = diffFields(undefined, after);
    expect(r1.changed.sort()).toEqual(["id", "name"]);
    expect(r1.after).toEqual({ id: 5, name: "new" });
    expect(r2.changed.sort()).toEqual(["id", "name"]);
  });

  it("is stable for empty inputs", () => {
    expect(diffFields()).toEqual({ changed: [], before: {}, after: {} });
    expect(diffFields({}, {})).toEqual({ changed: [], before: {}, after: {} });
  });
});
