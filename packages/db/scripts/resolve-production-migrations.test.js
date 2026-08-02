import { describe, expect, it, vi } from "vitest";
import {
  isAlreadyApplied,
  RECONCILIATION_MIGRATIONS,
  reconcileMigrationHistory,
} from "./resolve-production-migrations.mjs";

describe("production migration-history reconciliation", () => {
  it("recognizes Prisma's already-applied response", () => {
    expect(isAlreadyApplied("Error: P3008 migration already recorded as applied")).toBe(
      true,
    );
    expect(isAlreadyApplied("connection refused")).toBe(false);
  });

  it("resolves every baseline migration and skips P3008 idempotently", () => {
    const run = vi
      .fn()
      .mockReturnValueOnce({ status: 0, stdout: "ok", stderr: "" })
      .mockReturnValue({
        status: 1,
        stdout: "",
        stderr: "Error: P3008 migration already recorded as applied",
      });
    const output = { log: vi.fn(), error: vi.fn() };

    const result = reconcileMigrationHistory({ run, output });

    expect(run).toHaveBeenCalledTimes(RECONCILIATION_MIGRATIONS.length);
    expect(result).toEqual({
      resolved: 1,
      alreadyApplied: RECONCILIATION_MIGRATIONS.length - 1,
      dryRun: false,
    });
    expect(output.error).not.toHaveBeenCalled();
  });

  it("stops on an unexpected Prisma failure", () => {
    const run = vi.fn().mockReturnValue({
      status: 1,
      stdout: "",
      stderr: "Error: P1001 cannot reach database",
    });
    const output = { log: vi.fn(), error: vi.fn() };

    expect(() => reconcileMigrationHistory({ run, output })).toThrow(
      "Failed to resolve migration",
    );
    expect(run).toHaveBeenCalledTimes(1);
  });
});
