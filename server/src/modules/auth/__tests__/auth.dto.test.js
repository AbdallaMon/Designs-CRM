import { describe, it, expect } from "vitest";
import { AuthSchema } from "../auth.dto.js";

describe("toMe profile", () => {
  it("emits the stored profile when present", () => {
    const me = AuthSchema.toMe({ id: 1, email: "a@b.c", name: "A", role: "STAFF", profile: "PRIMARY_SALES" });
    expect(me.profile).toBe("PRIMARY_SALES");
  });
  it("derives the profile from legacy fields when unset", () => {
    const me = AuthSchema.toMe({ id: 1, email: "a@b.c", name: "A", role: "STAFF", isSuperSales: true, profile: null });
    expect(me.profile).toBe("SUPER_SALES");
  });
});
