import { describe, expect, it } from "vitest";
import { resolveCurrentPage } from "./resolveCurrentPage.js";

const links = [
  {
    name: "Deals",
    href: "/dashboard/deals",
    active: "deals",
    subLinks: [
      { name: "Current Deals", href: "/dashboard/deals", active: "deals" },
      { name: "On hold Deals", href: "/dashboard/on-hold-deals", active: "on-hold" },
      { name: "All Deals", href: "/dashboard/all-deals", active: "all-deals" },
    ],
  },
  {
    name: "Reports",
    href: "/dashboard/report",
    active: "report",
    subLinks: [
      { name: "Leads report", href: "/dashboard/report", active: "report" },
      { name: "Staff report", href: "/dashboard/report/staff", active: "report/staff" },
    ],
  },
];

describe("resolveCurrentPage", () => {
  it.each([
    ["/dashboard/on-hold-deals", "Deals", "On hold Deals"],
    ["/dashboard/all-deals", "Deals", "All Deals"],
    ["/dashboard/report/staff", "Reports", "Staff report"],
  ])("prefers the exact route for %s", (pathname, section, page) => {
    expect(resolveCurrentPage(links, pathname)).toEqual({ section, page });
  });
});
