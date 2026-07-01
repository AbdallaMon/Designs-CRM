import { describe, it, expect } from "vitest";
import { AuthSchema } from "../auth.dto.js";

describe("toMe", () => {
  it("includes navigationTabs for the role", () => {
    const me = AuthSchema.toMe({ id: 1, email: "a@b.c", name: "A", role: "ACCOUNTANT", subRoles: [] });
    expect(Array.isArray(me.navigationTabs)).toBe(true);
    expect(me.navigationTabs.map((t) => t.href)).toContain("/dashboard/salaries");
    expect(me.navigationTabs.map((t) => t.href)).not.toContain("/dashboard/leads");
  });
});
