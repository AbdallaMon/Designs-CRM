import { describe, it, expect } from "vitest";

// Trivial smoke test — proves the root vitest runner is wired so later module
// agents have a runner to extend. Real usecase/scope/validation tests come with
// each migrated module (see docs/migration/03-backend-plan.md §10).
describe("monorepo smoke", () => {
  it("runs the root test runner", () => {
    expect(1 + 1).toBe(2);
  });
});
