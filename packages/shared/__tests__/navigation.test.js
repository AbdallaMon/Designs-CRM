import { describe, it, expect } from "vitest";
import { buildNavigationTabs, NAVIGATION } from "../index.js";

const hrefs = (u) => buildNavigationTabs(u).map((t) => t.href);
const labels = (u) => buildNavigationTabs(u).map((t) => t.label);
const subOf = (u, href) =>
  (buildNavigationTabs(u).find((t) => t.href === href)?.subLinks || []).map((s) => ({
    label: s.label,
    href: s.href,
  }));

describe("buildNavigationTabs matches master's per-role nav", () => {
  it("ACCOUNTANT sees only the accounting screens (no leads/deals)", () => {
    const h = hrefs({ role: "ACCOUNTANT" });
    expect(h).toContain("/dashboard"); // Payments landing
    expect(h).toContain("/dashboard/operational-expenses");
    expect(h).toContain("/dashboard/rents");
    expect(h).toContain("/dashboard/salaries");
    expect(h).toContain("/dashboard/outcome");
    expect(h).not.toContain("/dashboard/leads");
    expect(h).not.toContain("/dashboard/users");
  });
  it("STAFF (sales) sees dashboard/leads/deals/my-day/calendar/payments, NOT users", () => {
    const h = hrefs({ role: "STAFF" });
    expect(h).toEqual([
      "/dashboard", "/dashboard/leads", "/dashboard/deals", "/dashboard/my-day",
      "/dashboard/calendar", "/dashboard/payments",
    ]);
  });
  it("STAFF + isSuperSales additionally sees users", () => {
    expect(hrefs({ role: "STAFF", isSuperSales: true })).toContain("/dashboard/users");
  });
  it("SUPER_SALES (role) sees users by role (master behavior)", () => {
    expect(hrefs({ role: "SUPER_SALES" })).toContain("/dashboard/users");
  });
  it("CONTACT_INITIATOR sees My Day (2026-07-15 additive) + leads", () => {
    expect(hrefs({ role: "CONTACT_INITIATOR" })).toEqual(["/dashboard/my-day", "/dashboard"]);
  });
  it("ADMIN sees users + website utilities + reports", () => {
    const h = hrefs({ role: "ADMIN" });
    expect(h).toContain("/dashboard/users");
    expect(h).toContain("/dashboard/website-utilities");
    expect(h).toContain("/dashboard/report");
  });
  it("THREE_D_DESIGNER sees work-stages, not leads/deals", () => {
    const h = hrefs({ role: "THREE_D_DESIGNER" });
    expect(h).toContain("/dashboard/work-stages");
    expect(h).not.toContain("/dashboard/leads");
    expect(h).not.toContain("/dashboard/deals");
  });
});

// ── Per-role Work-stages sub-link parity (the design refinement) ──────────────
// Master renders DIFFERENT "Work stages" sub-lists per role. buildNavigationTabs
// filters subLinks by role, so each role must get exactly master's sub-list.
describe("Work stages sub-links match master exactly (labels + hrefs + order)", () => {
  it("ADMIN work-stages sub-links", () => {
    expect(subOf({ role: "ADMIN" }, "/dashboard/work-stages")).toEqual([
      { label: "All projects", href: "/dashboard/projects" },
      { label: "Plan study department", href: "/dashboard/work-stages/study" },
      { label: "3D Work stage", href: "/dashboard/work-stages" },
      { label: "Final plan department", href: "/dashboard/work-stages/final-plan" },
      { label: "Quantity calcualtion department", href: "/dashboard/work-stages/quantity" },
      { label: "Archived projects", href: "/dashboard/projects/archived" },
      { label: "3D Modifcation", href: "/dashboard/work-stages/modification" },
    ]);
  });
  it("THREE_D_DESIGNER work-stages sub-links", () => {
    expect(subOf({ role: "THREE_D_DESIGNER" }, "/dashboard/work-stages")).toEqual([
      { label: "3D Work stage", href: "/dashboard/work-stages" },
      { label: "Modifcation stage", href: "/dashboard/modification" },
      { label: "Archived projects", href: "/dashboard/archived" },
    ]);
  });
  it("TWO_D_DESIGNER work-stages sub-links", () => {
    expect(subOf({ role: "TWO_D_DESIGNER" }, "/dashboard/work-stages")).toEqual([
      { label: "Plan study department", href: "/dashboard/study" },
      { label: "Final plan department", href: "/dashboard/final-plan" },
      { label: "Quantity calcualtion department", href: "/dashboard/quantity" },
      { label: "Archived projects", href: "/dashboard/archived" },
    ]);
  });
  it("TWO_D_EXECUTOR work-stage has NO sub-links (direct link)", () => {
    const item = buildNavigationTabs({ role: "TWO_D_EXECUTOR" }).find(
      (t) => t.href === "/dashboard/work-stages",
    );
    expect(item).toBeTruthy();
    expect(item.subLinks).toBeUndefined();
    expect(item.label).toBe("Work stage");
  });
});

// ── Full per-role parity: label + href + subLinks (label/href), in order ──────
// Transcribed directly from linksForRole(user) in
// web/src/app/(auth)/dashboard/(dashboard)/layout.jsx.
function expected(role, opts = {}) {
  return buildNavigationTabs({ role, ...opts }).map((t) => ({
    label: t.label,
    href: t.href,
    subLinks: t.subLinks ? t.subLinks.map((s) => ({ label: s.label, href: s.href })) : undefined,
  }));
}

const DEALS_SUBS = [
  { label: "Current Deals", href: "/dashboard/deals" },
  { label: "On hold Deals", href: "/dashboard/on-hold-deals" },
  { label: "All Deals", href: "/dashboard/all-deals" },
];

const MASTER = {
  ADMIN: [
    { label: "Dashboard", href: "/dashboard", subLinks: undefined },
    { label: "Users", href: "/dashboard/users", subLinks: undefined },
    { label: "Leads", href: "/dashboard/leads", subLinks: undefined },
    { label: "Deals", href: "/dashboard/deals", subLinks: DEALS_SUBS },
    {
      label: "Work stages",
      href: "/dashboard/work-stages",
      subLinks: [
        { label: "All projects", href: "/dashboard/projects" },
        { label: "Plan study department", href: "/dashboard/work-stages/study" },
        { label: "3D Work stage", href: "/dashboard/work-stages" },
        { label: "Final plan department", href: "/dashboard/work-stages/final-plan" },
        { label: "Quantity calcualtion department", href: "/dashboard/work-stages/quantity" },
        { label: "Archived projects", href: "/dashboard/projects/archived" },
        { label: "3D Modifcation", href: "/dashboard/work-stages/modification" },
      ],
    },
    {
      label: "Reports",
      href: "/dashboard/report",
      subLinks: [
        { label: "Leads report", href: "/dashboard/report" },
        { label: "Staff report", href: "/dashboard/report/staff" },
      ],
    },
    { label: "Audit Log", href: "/dashboard/audit-logs", subLinks: undefined },
    { label: "My Day", href: "/dashboard/my-day", subLinks: undefined },
    { label: "Images session gallery", href: "/dashboard/image-sessions", subLinks: undefined },
    { label: "Calendar", href: "/dashboard/calendar", subLinks: undefined },
    { label: "Payments", href: "/dashboard/payments", subLinks: undefined },
    { label: "Website utilities", href: "/dashboard/website-utilities", subLinks: undefined },
  ],
  STAFF: [
    { label: "Dashboard", href: "/dashboard", subLinks: undefined },
    { label: "Leads", href: "/dashboard/leads", subLinks: undefined },
    { label: "Deals", href: "/dashboard/deals", subLinks: DEALS_SUBS },
    { label: "My Day", href: "/dashboard/my-day", subLinks: undefined },
    { label: "Calendar", href: "/dashboard/calendar", subLinks: undefined },
    { label: "Payments", href: "/dashboard/payments", subLinks: undefined },
  ],
  SUPER_SALES: [
    { label: "Dashboard", href: "/dashboard", subLinks: undefined },
    { label: "Leads", href: "/dashboard/leads", subLinks: undefined },
    { label: "Deals", href: "/dashboard/deals", subLinks: DEALS_SUBS },
    { label: "My Day", href: "/dashboard/my-day", subLinks: undefined },
    { label: "Calendar", href: "/dashboard/calendar", subLinks: undefined },
    { label: "Payments", href: "/dashboard/payments", subLinks: undefined },
    { label: "Users", href: "/dashboard/users", subLinks: undefined },
  ],
  THREE_D_DESIGNER: [
    { label: "Dashboard", href: "/dashboard", subLinks: undefined },
    {
      label: "Work stages",
      href: "/dashboard/work-stages",
      subLinks: [
        { label: "3D Work stage", href: "/dashboard/work-stages" },
        { label: "Modifcation stage", href: "/dashboard/modification" },
        { label: "Archived projects", href: "/dashboard/archived" },
      ],
    },
    { label: "My Day", href: "/dashboard/my-day", subLinks: undefined },
  ],
  TWO_D_DESIGNER: [
    { label: "Dashboard", href: "/dashboard", subLinks: undefined },
    {
      label: "Work stages",
      href: "/dashboard/work-stages",
      subLinks: [
        { label: "Plan study department", href: "/dashboard/study" },
        { label: "Final plan department", href: "/dashboard/final-plan" },
        { label: "Quantity calcualtion department", href: "/dashboard/quantity" },
        { label: "Archived projects", href: "/dashboard/archived" },
      ],
    },
    { label: "My Day", href: "/dashboard/my-day", subLinks: undefined },
  ],
  TWO_D_EXECUTOR: [
    { label: "My Day", href: "/dashboard/my-day", subLinks: undefined },
    { label: "Leads", href: "/dashboard", subLinks: undefined },
    { label: "Work stage", href: "/dashboard/work-stages", subLinks: undefined },
  ],
  // ACCOUNTANT + CONTACT_INITIATOR: master's nav PLUS the My Day tab (2026-07-15
  // documented additive change — collections / first-touch queues; parity addendum).
  ACCOUNTANT: [
    { label: "My Day", href: "/dashboard/my-day", subLinks: undefined },
    { label: "Payments", href: "/dashboard", subLinks: undefined },
    { label: "Operational Expenses", href: "/dashboard/operational-expenses", subLinks: undefined },
    { label: "Rents", href: "/dashboard/rents", subLinks: undefined },
    { label: "Salaries", href: "/dashboard/salaries", subLinks: undefined },
    { label: "Outstanding Payments", href: "/dashboard/outcome", subLinks: undefined },
  ],
  CONTACT_INITIATOR: [
    { label: "My Day", href: "/dashboard/my-day", subLinks: undefined },
    { label: "Leads", href: "/dashboard", subLinks: undefined },
  ],
};

describe("full per-role parity with linksForRole (all 9 roles)", () => {
  for (const [role, exp] of Object.entries(MASTER)) {
    it(`${role} matches master`, () => {
      expect(expected(role)).toEqual(exp);
    });
  }
  it("STAFF + isSuperSales === SUPER_SALES nav", () => {
    expect(expected("STAFF", { isSuperSales: true })).toEqual(MASTER.SUPER_SALES);
  });
  it("SUPER_ADMIN === ADMIN nav", () => {
    expect(expected("SUPER_ADMIN")).toEqual(MASTER.ADMIN);
  });
});

describe("NAVIGATION config shape", () => {
  it("every item has key/label/href/allowedRoles", () => {
    for (const item of NAVIGATION) {
      expect(typeof item.key).toBe("string");
      expect(typeof item.label).toBe("string");
      expect(typeof item.href).toBe("string");
      expect(Array.isArray(item.allowedRoles)).toBe(true);
      expect(item.allowedRoles.length).toBeGreaterThan(0);
    }
  });
  it("returns [] for a user with no role", () => {
    expect(buildNavigationTabs(undefined)).toEqual([]);
    expect(buildNavigationTabs({})).toEqual([]);
  });
});
