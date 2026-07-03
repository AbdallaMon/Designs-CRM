import { describe, it, expect } from "vitest";
import { buildNavigationTabs } from "../helpers.js";

describe("navigationTabs follow navRole (the active profile)", () => {
  it("navRole overrides the base role — an ADMIN on an ACCOUNTANT profile sees salaries, not leads", () => {
    const tabs = buildNavigationTabs({ role: "ADMIN", navRole: "ACCOUNTANT", permissions: [] });
    const hrefs = tabs.map((t) => t.href);
    expect(hrefs).toContain("/dashboard/salaries");
    expect(hrefs).not.toContain("/dashboard/leads");
  });

  it("without navRole it falls back to the role (unmigrated parity)", () => {
    const tabs = buildNavigationTabs({ role: "ACCOUNTANT", permissions: [] });
    expect(tabs.map((t) => t.href)).toContain("/dashboard/salaries");
  });

  it("SUPER_SALES navRole renders the super-sales sidebar even though its baseRole is STAFF", () => {
    const staff = buildNavigationTabs({ role: "STAFF", navRole: "STAFF", permissions: [] }).map((t) => t.href);
    const superSales = buildNavigationTabs({ role: "STAFF", navRole: "SUPER_SALES", permissions: [] }).map((t) => t.href);
    // The two sidebars differ — proving navRole (not the STAFF base) drives it.
    expect(superSales).not.toEqual(staff);
  });
});
