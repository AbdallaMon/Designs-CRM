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
    const h = hrefs({ profile: "ACCOUNTANT" });
    expect(h).toContain("/dashboard"); // Payments landing
    expect(h).toContain("/dashboard/operational-expenses");
    expect(h).toContain("/dashboard/rents");
    expect(h).toContain("/dashboard/salaries");
    expect(h).toContain("/dashboard/outcome");
    expect(h).not.toContain("/dashboard/leads");
    expect(h).not.toContain("/dashboard/users");
  });
  it("STAFF (sales) sees dashboard/leads/deals/calendar/payments, NOT users", () => {
    const h = hrefs({ profile: "NORMAL_SALES" });
    expect(h).toEqual([
      "/dashboard", "/dashboard/leads", "/dashboard/deals",
      "/dashboard/calendar", "/dashboard/payments",
    ]);
  });
  it("STAFF resolved to the SUPER_SALES nav role (via navRole, as auth.dto.toMe computes it from the active profile) additionally sees users", () => {
    // navRoleFor no longer reads isSuperSales directly (Phase 4) — the sidebar is
    // driven by `navRole`, which auth.dto.toMe derives from the active profile.
    expect(hrefs({ profile: "SUPER_SALES"  })).toContain("/dashboard/users");
  });
  it("SUPER_SALES (role) sees users by role (master behavior)", () => {
    expect(hrefs({ profile: "SUPER_SALES" })).toContain("/dashboard/users");
  });
  it("CONTACT_INITIATOR sees only leads", () => {
    expect(hrefs({ profile: "CONTACT_INITIATOR" })).toEqual(["/dashboard"]);
  });
  it("ADMIN sees users + website utilities + reports", () => {
    const h = hrefs({ profile: "ADMIN" });
    expect(h).toContain("/dashboard/users");
    expect(h).toContain("/dashboard/website-utilities");
    expect(h).toContain("/dashboard/report");
  });
  it("THREE_D_DESIGNER sees work-stages, not leads/deals", () => {
    const h = hrefs({ profile: "DESIGNER_3D" });
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
    expect(subOf({ profile: "ADMIN" }, "/dashboard/work-stages")).toEqual([
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
    expect(subOf({ profile: "DESIGNER_3D" }, "/dashboard/work-stages")).toEqual([
      { label: "3D Work stage", href: "/dashboard/work-stages" },
      { label: "Modifcation stage", href: "/dashboard/work-stages/modification" },
      { label: "Archived projects", href: "/dashboard/projects/archived" },
    ]);
  });
  it("TWO_D_DESIGNER work-stages sub-links", () => {
    expect(subOf({ profile: "DESIGNER_2D" }, "/dashboard/work-stages")).toEqual([
      { label: "Plan study department", href: "/dashboard/work-stages/study" },
      { label: "Final plan department", href: "/dashboard/work-stages/final-plan" },
      { label: "Quantity calcualtion department", href: "/dashboard/work-stages/quantity" },
      { label: "Archived projects", href: "/dashboard/projects/archived" },
    ]);
  });
  it("TWO_D_EXECUTOR work-stage has NO sub-links (direct link)", () => {
    const item = buildNavigationTabs({ profile: "EXECUTOR_2D" }).find(
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
const PROFILE_BY_PERSONA = {
  ADMIN: "ADMIN",
  SUPER_ADMIN: "SUPER_ADMIN",
  STAFF: "NORMAL_SALES",
  SUPER_SALES: "SUPER_SALES",
  ACCOUNTANT: "ACCOUNTANT",
  THREE_D_DESIGNER: "DESIGNER_3D",
  TWO_D_DESIGNER: "DESIGNER_2D",
  TWO_D_EXECUTOR: "EXECUTOR_2D",
  CONTACT_INITIATOR: "CONTACT_INITIATOR",
};

function expected(persona, opts = {}) {
  const profile =
    opts.profile ??
    (opts.navRole === "SUPER_SALES"
      ? "SUPER_SALES"
      : PROFILE_BY_PERSONA[persona]);
  return buildNavigationTabs({ profile }).map((t) => ({
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
    // ⏸️ 2026-07-16: the "Audit Log" + "My Day" rows are commented out in navigation.js
    //    (user request; pages render blank). Hiding them restores EXACT master nav parity.
    { label: "Images session gallery", href: "/dashboard/image-sessions", subLinks: undefined },
    { label: "Calendar", href: "/dashboard/calendar", subLinks: undefined },
    { label: "Payments", href: "/dashboard/payments", subLinks: undefined },
    { label: "Website utilities", href: "/dashboard/website-utilities", subLinks: undefined },
  ],
  STAFF: [
    { label: "Dashboard", href: "/dashboard", subLinks: undefined },
    { label: "Leads", href: "/dashboard/leads", subLinks: undefined },
    { label: "Deals", href: "/dashboard/deals", subLinks: DEALS_SUBS },
    { label: "Calendar", href: "/dashboard/calendar", subLinks: undefined },
    { label: "Payments", href: "/dashboard/payments", subLinks: undefined },
  ],
  SUPER_SALES: [
    { label: "Dashboard", href: "/dashboard", subLinks: undefined },
    { label: "Leads", href: "/dashboard/leads", subLinks: undefined },
    { label: "Deals", href: "/dashboard/deals", subLinks: DEALS_SUBS },
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
        { label: "Modifcation stage", href: "/dashboard/work-stages/modification" },
        { label: "Archived projects", href: "/dashboard/projects/archived" },
      ],
    },
  ],
  TWO_D_DESIGNER: [
    { label: "Dashboard", href: "/dashboard", subLinks: undefined },
    {
      label: "Work stages",
      href: "/dashboard/work-stages",
      subLinks: [
        { label: "Plan study department", href: "/dashboard/work-stages/study" },
        { label: "Final plan department", href: "/dashboard/work-stages/final-plan" },
        { label: "Quantity calcualtion department", href: "/dashboard/work-stages/quantity" },
        { label: "Archived projects", href: "/dashboard/projects/archived" },
      ],
    },
  ],
  TWO_D_EXECUTOR: [
    { label: "Leads", href: "/dashboard", subLinks: undefined },
    { label: "Work stage", href: "/dashboard/work-stages", subLinks: undefined },
  ],
  ACCOUNTANT: [
    { label: "Payments", href: "/dashboard", subLinks: undefined },
    { label: "Operational Expenses", href: "/dashboard/operational-expenses", subLinks: undefined },
    { label: "Rents", href: "/dashboard/rents", subLinks: undefined },
    { label: "Salaries", href: "/dashboard/salaries", subLinks: undefined },
    { label: "Outstanding Payments", href: "/dashboard/outcome", subLinks: undefined },
  ],
  CONTACT_INITIATOR: [{ label: "Leads", href: "/dashboard", subLinks: undefined }],
};

describe("full per-role parity with linksForRole (all 9 roles)", () => {
  for (const [role, exp] of Object.entries(MASTER)) {
    it(`${role} matches master`, () => {
      expect(expected(role)).toEqual(exp);
    });
  }
  it("STAFF resolved to the SUPER_SALES nav role (via navRole) === SUPER_SALES nav", () => {
    expect(expected("STAFF", { navRole: "SUPER_SALES" })).toEqual(MASTER.SUPER_SALES);
  });
  it("SUPER_ADMIN === ADMIN nav", () => {
    expect(expected("SUPER_ADMIN")).toEqual(MASTER.ADMIN);
  });
});

describe("NAVIGATION config shape", () => {
  it("every item has key/label/href/allowedProfiles", () => {
    for (const item of NAVIGATION) {
      expect(typeof item.key).toBe("string");
      expect(typeof item.label).toBe("string");
      expect(typeof item.href).toBe("string");
      expect(Array.isArray(item.allowedProfiles)).toBe(true);
      expect(item.allowedProfiles.length).toBeGreaterThan(0);
    }
  });
  it("returns [] for a user with no active profile", () => {
    expect(buildNavigationTabs(undefined)).toEqual([]);
    expect(buildNavigationTabs({})).toEqual([]);
  });
});
