import { describe, expect, it, vi } from "vitest";
import {
  applyLeadFieldUpdate,
  mergeLeadFieldUpdate,
} from "../leadFieldState.js";

describe("leadFieldState", () => {
  it("merges a top-level lead field instead of nesting it under update", () => {
    const result = mergeLeadFieldUpdate(
      { id: 1, finalizedDate: null, status: "FINALIZED" },
      {
        field: "finalizedDate",
        updatedEntity: { finalizedDate: "2026-08-16T00:00:00.000Z" },
      },
    );

    expect(result.finalizedDate).toBe("2026-08-16T00:00:00.000Z");
    expect(result).not.toHaveProperty("update");
  });

  it("merges client name/phone into the lowercase client object", () => {
    const result = mergeLeadFieldUpdate(
      { id: 1, client: { id: 9, name: "Old", phone: "111" } },
      {
        field: "phone",
        section: "client",
        updatedEntity: { id: 9, phone: "222" },
      },
    );

    expect(result.client).toEqual({ id: 9, name: "Old", phone: "222" });
  });

  it("updates both detail and list state while preserving unrelated leads", () => {
    const setLead = vi.fn((updater) =>
      updater({ id: 1, client: { id: 9, name: "Old" } }),
    );
    const setLeads = vi.fn((updater) =>
      updater([
        { id: 1, client: { id: 9, name: "Old" } },
        { id: 2, client: { id: 10, name: "Other" } },
      ]),
    );

    applyLeadFieldUpdate({
      leadId: 1,
      field: "name",
      section: "client",
      updatedEntity: { id: 9, name: "Updated" },
      setLead,
      setLeads,
    });

    expect(setLead.mock.results[0].value.client.name).toBe("Updated");
    expect(setLeads.mock.results[0].value).toEqual([
      { id: 1, client: { id: 9, name: "Updated" } },
      { id: 2, client: { id: 10, name: "Other" } },
    ]);
  });
});
