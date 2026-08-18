import { describe, expect, it } from "vitest";
import {
  formatSearchOption,
  getNewLeadSearchHref,
  uniqueSearchResults,
} from "../search-options.js";

describe("lead search options", () => {
  it("deduplicates records by stable lead id", () => {
    expect(
      uniqueSearchResults([
        { id: 12, code: "A" },
        { id: 12, code: "A" },
        { id: 13, code: "B" },
      ]),
    ).toEqual([
      { id: 12, code: "A" },
      { id: 13, code: "B" },
    ]);
  });

  it("always displays the lead id and code before client details", () => {
    expect(
      formatSearchOption(
        { id: 42, code: "LD-9", client: { name: "Mona" } },
        "leads",
        ["client.name"],
      ),
    ).toBe("0000042 - code LD-9 - Mona");
  });

  it("routes only NEW lead search options to their lead page", () => {
    expect(
      getNewLeadSearchHref({ id: 42, status: "NEW" }, "leads"),
    ).toBe("/dashboard/deals/42");
    expect(
      getNewLeadSearchHref({ id: 42, status: "IN_PROGRESS" }, "leads"),
    ).toBeNull();
    expect(
      getNewLeadSearchHref({ id: 42, status: "NEW" }, "users"),
    ).toBeNull();
  });
});
