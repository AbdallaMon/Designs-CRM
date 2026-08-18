import { describe, it, expect } from "vitest";
import { isAllowed } from "../routeAccess.js";

describe("routeAccess.isAllowed", () => {
  it("ACCOUNTANT tabs: allows own hrefs and segments, denies others", () => {
    const tabs = [
      { key: "dashboard", label: "Dashboard", href: "/dashboard" },
      {
        key: "operational-expenses",
        label: "Operational Expenses",
        href: "/dashboard/operational-expenses",
      },
      { key: "rents", label: "Rents", href: "/dashboard/rents" },
      { key: "salaries", label: "Salaries", href: "/dashboard/salaries" },
      { key: "outcome", label: "Outstanding Payments", href: "/dashboard/outcome" },
    ];

    expect(isAllowed("/dashboard/leads", tabs)).toBe(false);
    expect(isAllowed("/dashboard/salaries", tabs)).toBe(true);
    expect(isAllowed("/dashboard/salaries/5", tabs)).toBe(true); // segment
    expect(isAllowed("/dashboard", tabs)).toBe(true); // landing
    expect(isAllowed("/dashboard/notifications", tabs)).toBe(true); // always-allowed
    expect(isAllowed("/dashboard/chat", tabs)).toBe(true); // always-allowed
    expect(isAllowed("/dashboard/tasks/9", tabs)).toBe(true); // always-allowed
  });

  it("STAFF tabs (no users tab): denies /dashboard/users", () => {
    const tabs = [
      { key: "dashboard", label: "Dashboard", href: "/dashboard" },
      { key: "leads", label: "Leads", href: "/dashboard/leads" },
      { key: "deals", label: "Deals", href: "/dashboard/deals" },
    ];

    expect(isAllowed("/dashboard/users", tabs)).toBe(false);
  });

  it("SUPER_SALES tabs (with a /dashboard/users item): allows /dashboard/users", () => {
    const tabs = [
      { key: "dashboard", label: "Dashboard", href: "/dashboard" },
      { key: "leads", label: "Leads", href: "/dashboard/leads" },
      { key: "users", label: "Users", href: "/dashboard/users" },
    ];

    expect(isAllowed("/dashboard/users", tabs)).toBe(true);
  });

  it("tabs with subLinks: allows subLink segment and top-level detail routes", () => {
    const dealsTabs = [
      { key: "dashboard", label: "Dashboard", href: "/dashboard" },
      {
        key: "deals",
        label: "Deals",
        href: "/dashboard/deals",
        subLinks: [
          {
            key: "on-hold-deals",
            label: "On hold Deals",
            href: "/dashboard/on-hold-deals",
          },
        ],
      },
    ];

    expect(isAllowed("/dashboard/on-hold-deals", dealsTabs)).toBe(true); // subLink segment
    expect(isAllowed("/dashboard/deals/9", dealsTabs)).toBe(true); // detail
  });

  it.each(["DESIGNER_3D", "DESIGNER_2D"])(
    "allows an assigned-workflow lead detail URL for %s without exposing the deals list",
    (profile) => {
      const designerTabs = [
        { key: "dashboard", label: "Dashboard", href: "/dashboard" },
        {
          key: "work-stages",
          label: "Work stages",
          href: "/dashboard/work-stages",
          subLinks: [{ label: "Archived", href: "/dashboard/projects/archived" }],
        },
      ];

      expect(isAllowed("/dashboard/deals/42", designerTabs, profile)).toBe(true);
      expect(isAllowed("/dashboard/deals", designerTabs, profile)).toBe(false);
      expect(isAllowed("/dashboard/deals/42/edit", designerTabs, profile)).toBe(false);
    },
  );
});
