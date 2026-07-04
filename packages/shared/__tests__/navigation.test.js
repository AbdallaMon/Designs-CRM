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
  it("STAFF (sales) sees dashboard/leads/deals/calendar/payments, NOT users", () => {
    const h = hrefs({ role: "STAFF" });
    expect(h).toEqual([
      "/dashboard", "/dashboard/leads", "/dashboard/deals",
      "/dashboard/calendar", "/dashboard/payments",
    ]);
  });
  it("STAFF + isSuperSales additionally sees users", () => {
    expect(hrefs({ role: "STAFF", isSuperSales: true })).toContain("/dashboard/users");
  });
  it("SUPER_SALES (role) sees users by role (master behavior)", () => {
    expect(hrefs({ role: "SUPER_SALES" })).toContain("/dashboard/users");
  });
  it("CONTACT_INITIATOR sees only leads", () => {
    expect(hrefs({ role: "CONTACT_INITIATOR" })).toEqual(["/dashboard"]);
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
      { label: "كل المشاريع", href: "/dashboard/projects" },
      { label: "قسم دراسة المخطط", href: "/dashboard/work-stages/study" },
      { label: "مرحلة العمل ثلاثي الأبعاد", href: "/dashboard/work-stages" },
      { label: "قسم المخطط النهائي", href: "/dashboard/work-stages/final-plan" },
      { label: "قسم حساب الكميات", href: "/dashboard/work-stages/quantity" },
      { label: "المشاريع المؤرشفة", href: "/dashboard/projects/archived" },
      { label: "التعديلات ثلاثية الأبعاد", href: "/dashboard/work-stages/modification" },
    ]);
  });
  it("THREE_D_DESIGNER work-stages sub-links", () => {
    expect(subOf({ role: "THREE_D_DESIGNER" }, "/dashboard/work-stages")).toEqual([
      { label: "مرحلة العمل ثلاثي الأبعاد", href: "/dashboard/work-stages" },
      { label: "مرحلة التعديل", href: "/dashboard/modification" },
      { label: "المشاريع المؤرشفة", href: "/dashboard/archived" },
    ]);
  });
  it("TWO_D_DESIGNER work-stages sub-links", () => {
    expect(subOf({ role: "TWO_D_DESIGNER" }, "/dashboard/work-stages")).toEqual([
      { label: "قسم دراسة المخطط", href: "/dashboard/study" },
      { label: "قسم المخطط النهائي", href: "/dashboard/final-plan" },
      { label: "قسم حساب الكميات", href: "/dashboard/quantity" },
      { label: "المشاريع المؤرشفة", href: "/dashboard/archived" },
    ]);
  });
  it("TWO_D_EXECUTOR work-stage has NO sub-links (direct link)", () => {
    const item = buildNavigationTabs({ role: "TWO_D_EXECUTOR" }).find(
      (t) => t.href === "/dashboard/work-stages",
    );
    expect(item).toBeTruthy();
    expect(item.subLinks).toBeUndefined();
    expect(item.label).toBe("مرحلة العمل");
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
  { label: "الصفقات الحالية", href: "/dashboard/deals" },
  { label: "الصفقات المعلقة", href: "/dashboard/on-hold-deals" },
  { label: "كل الصفقات", href: "/dashboard/all-deals" },
];

const MASTER = {
  ADMIN: [
    { label: "لوحة التحكم", href: "/dashboard", subLinks: undefined },
    { label: "المستخدمون", href: "/dashboard/users", subLinks: undefined },
    { label: "العملاء المحتملون", href: "/dashboard/leads", subLinks: undefined },
    { label: "الصفقات", href: "/dashboard/deals", subLinks: DEALS_SUBS },
    {
      label: "مراحل العمل",
      href: "/dashboard/work-stages",
      subLinks: [
        { label: "كل المشاريع", href: "/dashboard/projects" },
        { label: "قسم دراسة المخطط", href: "/dashboard/work-stages/study" },
        { label: "مرحلة العمل ثلاثي الأبعاد", href: "/dashboard/work-stages" },
        { label: "قسم المخطط النهائي", href: "/dashboard/work-stages/final-plan" },
        { label: "قسم حساب الكميات", href: "/dashboard/work-stages/quantity" },
        { label: "المشاريع المؤرشفة", href: "/dashboard/projects/archived" },
        { label: "التعديلات ثلاثية الأبعاد", href: "/dashboard/work-stages/modification" },
      ],
    },
    {
      label: "التقارير",
      href: "/dashboard/report",
      subLinks: [
        { label: "تقرير العملاء المحتملين", href: "/dashboard/report" },
        { label: "تقرير الموظفين", href: "/dashboard/report/staff" },
      ],
    },
    { label: "معرض جلسات الصور", href: "/dashboard/image-sessions", subLinks: undefined },
    { label: "التقويم", href: "/dashboard/calendar", subLinks: undefined },
    { label: "المدفوعات", href: "/dashboard/payments", subLinks: undefined },
    { label: "إعدادات الموقع", href: "/dashboard/website-utilities", subLinks: undefined },
  ],
  STAFF: [
    { label: "لوحة التحكم", href: "/dashboard", subLinks: undefined },
    { label: "العملاء المحتملون", href: "/dashboard/leads", subLinks: undefined },
    { label: "الصفقات", href: "/dashboard/deals", subLinks: DEALS_SUBS },
    { label: "التقويم", href: "/dashboard/calendar", subLinks: undefined },
    { label: "المدفوعات", href: "/dashboard/payments", subLinks: undefined },
  ],
  SUPER_SALES: [
    { label: "لوحة التحكم", href: "/dashboard", subLinks: undefined },
    { label: "العملاء المحتملون", href: "/dashboard/leads", subLinks: undefined },
    { label: "الصفقات", href: "/dashboard/deals", subLinks: DEALS_SUBS },
    { label: "التقويم", href: "/dashboard/calendar", subLinks: undefined },
    { label: "المدفوعات", href: "/dashboard/payments", subLinks: undefined },
    { label: "المستخدمون", href: "/dashboard/users", subLinks: undefined },
  ],
  THREE_D_DESIGNER: [
    { label: "لوحة التحكم", href: "/dashboard", subLinks: undefined },
    {
      label: "مراحل العمل",
      href: "/dashboard/work-stages",
      subLinks: [
        { label: "مرحلة العمل ثلاثي الأبعاد", href: "/dashboard/work-stages" },
        { label: "مرحلة التعديل", href: "/dashboard/modification" },
        { label: "المشاريع المؤرشفة", href: "/dashboard/archived" },
      ],
    },
  ],
  TWO_D_DESIGNER: [
    { label: "لوحة التحكم", href: "/dashboard", subLinks: undefined },
    {
      label: "مراحل العمل",
      href: "/dashboard/work-stages",
      subLinks: [
        { label: "قسم دراسة المخطط", href: "/dashboard/study" },
        { label: "قسم المخطط النهائي", href: "/dashboard/final-plan" },
        { label: "قسم حساب الكميات", href: "/dashboard/quantity" },
        { label: "المشاريع المؤرشفة", href: "/dashboard/archived" },
      ],
    },
  ],
  TWO_D_EXECUTOR: [
    { label: "العملاء المحتملون", href: "/dashboard", subLinks: undefined },
    { label: "مرحلة العمل", href: "/dashboard/work-stages", subLinks: undefined },
  ],
  ACCOUNTANT: [
    { label: "المدفوعات", href: "/dashboard", subLinks: undefined },
    { label: "المصروفات التشغيلية", href: "/dashboard/operational-expenses", subLinks: undefined },
    { label: "الإيجارات", href: "/dashboard/rents", subLinks: undefined },
    { label: "الرواتب", href: "/dashboard/salaries", subLinks: undefined },
    { label: "المستحقات", href: "/dashboard/outcome", subLinks: undefined },
  ],
  CONTACT_INITIATOR: [{ label: "العملاء المحتملون", href: "/dashboard", subLinks: undefined }],
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
