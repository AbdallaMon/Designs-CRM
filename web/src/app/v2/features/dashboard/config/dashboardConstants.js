// Dashboard presentational constants — UI copy KEYS + widget metadata for the role-adaptive home
// (UX plan §3.1: ACTION-QUEUE-FIRST). NO hard-coded prose lives in component logic; every visible
// string is resolved at render time via t("dashboard.*") (or, for backend message CODES, through
// dashboardMessages.js). Pure data — no React, no hooks at module scope.
//
// i18n: this module exposes language-neutral KEYS (labelKey / *.copyKey). Components hold useT and
// resolve them; the value formatters below are presentation logic and stay as-is.

// ── Page-level copy KEYS ────────────────────────────────────────────────────────────────
export const DASHBOARD_COPY_KEYS = {
  title: "dashboard.title",
  subtitle: "dashboard.subtitle",
  denied: "dashboard.denied",
  // The action-queue "all good" empty state (role-aware default).
  queueAllGoodTitle: "dashboard.queue.allGood.title",
  queueAllGoodDescription: "dashboard.queue.allGood.description",
};

// ── Section heading KEYS ────────────────────────────────────────────────────────────────
export const DASHBOARD_SECTION_KEYS = {
  actionQueue: "dashboard.section.actionQueue",
  kpis: "dashboard.section.kpis",
  leadsStatus: "dashboard.section.leadsStatus",
  latestLeads: "dashboard.section.latestLeads",
  designerBoard: "dashboard.section.designerBoard",
  charts: "dashboard.section.charts",
  monthlyPerformance: "dashboard.section.monthlyPerformance",
  weekPerformance: "dashboard.section.weekPerformance",
  emiratesAnalytics: "dashboard.section.emiratesAnalytics",
  leadsMonthlyOverview: "dashboard.section.leadsMonthlyOverview",
};

// Latest-leads compact list (row 5) — each row deep-links to the lead hub /v2/leads/{id}.
export const LATEST_LEADS_COPY_KEYS = {
  empty: "dashboard.latestLeads.empty",
  actionLabel: "dashboard.latestLeads.actionLabel",
};

// ── Filter bar copy KEYS ────────────────────────────────────────────────────────────────
export const FILTER_COPY_KEYS = {
  startDate: "dashboard.filter.startDate",
  endDate: "dashboard.filter.endDate",
  staffId: "dashboard.filter.staffId",
  staffHelper: "dashboard.filter.staffHelper",
  apply: "dashboard.filter.apply",
  reset: "dashboard.filter.reset",
};

// ── Action-queue copy KEYS (each queue source deep-links to its next action) ────────────
export const QUEUE_COPY_KEYS = {
  // latest-leads pool — newest unassigned NEW leads waiting for first contact.
  latestLeads: {
    groupTitle: "dashboard.queue.latestLeads.groupTitle",
    actionLabel: "dashboard.queue.latestLeads.actionLabel",
    emptyHint: "dashboard.queue.latestLeads.emptyHint",
  },
  // recent-activities feed — the caller's latest notifications, each linking to its source.
  recentActivities: {
    groupTitle: "dashboard.queue.recentActivities.groupTitle",
    actionLabel: "dashboard.queue.recentActivities.actionLabel",
    emptyHint: "dashboard.queue.recentActivities.emptyHint",
  },
};

// ── KPI cards — metadata over getKeyMetrics(). `field` maps to the envelope key; `format`
//    selects the value formatter; `accent` is a semantic hint (neutral|positive|warning);
//    `labelKey` resolves to the visible label via t() at render time. ──
export const KPI_CARDS = [
  { key: "totalRevenue", labelKey: "dashboard.kpi.totalRevenue", field: "totalRevenue", format: "currency", accent: "positive" },
  { key: "averageProjectValue", labelKey: "dashboard.kpi.averageProjectValue", field: "averageProjectValue", format: "currency", accent: "neutral" },
  { key: "successRate", labelKey: "dashboard.kpi.successRate", field: "successRate", format: "percent", accent: "positive" },
  { key: "leadsCounts", labelKey: "dashboard.kpi.leadsCounts", field: "leadsCounts", format: "number", accent: "neutral" },
  { key: "interactedLeads", labelKey: "dashboard.kpi.interactedLeads", field: "interactedLeads", format: "number", accent: "neutral" },
  { key: "newLeadCounts", labelKey: "dashboard.kpi.newLeadCounts", field: "newLeadCounts", format: "number", accent: "warning" },
  { key: "totalCommission", labelKey: "dashboard.kpi.totalCommission", field: "totalCommission", format: "currency", accent: "neutral" },
  { key: "successLeadsCount", labelKey: "dashboard.kpi.successLeadsCount", field: "successLeadsCount", format: "number", accent: "positive" },
];

// ── Designer / production board — metadata over getDesignerMetrics(). ──────────────────
export const DESIGNER_CARDS = [
  { key: "notStartedProject", labelKey: "dashboard.designer.notStarted", field: "notStartedProject", domain: "task", status: "TODO" },
  { key: "inProgressProject", labelKey: "dashboard.designer.inProgress", field: "inProgressProject", domain: "task", status: "IN_PROGRESS" },
  { key: "holdProjects", labelKey: "dashboard.designer.hold", field: "holdProjects", domain: "task", status: "CANCELLED" },
  { key: "completedProjects", labelKey: "dashboard.designer.completed", field: "completedProjects", domain: "task", status: "DONE" },
];

export const DESIGNER_META = [
  { key: "totalProjects", labelKey: "dashboard.designer.totalProjects", field: "totalProjects", format: "number" },
  { key: "totalArea", labelKey: "dashboard.designer.totalArea", field: "totalArea", format: "area" },
  { key: "currentMonthArea", labelKey: "dashboard.designer.currentMonthArea", field: "currentMonthArea", format: "area" },
  { key: "totalTimeSpent", labelKey: "dashboard.designer.totalTimeSpent", field: "totalTimeSpent", format: "hours" },
];

// ── Value formatters (presentation only; the data layer is fixed). ─────────────────────
const NUMBER_FMT = new Intl.NumberFormat("ar-AE");

export function formatMetric(value, format) {
  const n = typeof value === "string" ? Number(value) : value;
  if (value === null || value === undefined || Number.isNaN(n)) {
    if (format === "percent") return "٠٪";
    return format === "currency" ? "٠ د.إ" : "٠";
  }
  switch (format) {
    case "currency":
      return `${NUMBER_FMT.format(Math.round(n))} د.إ`;
    case "percent":
      return `${NUMBER_FMT.format(n)}٪`;
    case "area":
      return `${NUMBER_FMT.format(n)} م²`;
    case "hours":
      return `${NUMBER_FMT.format(n)} ساعة`;
    case "number":
    default:
      return NUMBER_FMT.format(n);
  }
}

// Accent → theme palette path for KPI value emphasis.
export const ACCENT_COLOR = {
  positive: "success.main",
  warning: "warning.main",
  neutral: "text.primary",
};
