// Dashboard presentational constants — Arabic UI copy + widget metadata for the role-adaptive
// home (UX plan §3.1: ACTION-QUEUE-FIRST). NO hard-coded prose lives in component logic; every
// visible string is sourced here (or, for backend message CODES, through dashboardMessages.js).
// Single-language Arabic / RTL. Pure data — no React, no side effects.

// ── Page-level copy ────────────────────────────────────────────────────────────────────
export const DASHBOARD_COPY = {
  title: "لوحة التحكم",
  subtitle: "نظرة سريعة على ما يحتاج انتباهك اليوم",
  denied: "لا تملك صلاحية الوصول إلى لوحة التحكم",
  // The action-queue "all good" empty state (role-aware default).
  queueAllGoodTitle: "كل شيء على ما يرام",
  queueAllGoodDescription: "لا يوجد ما يحتاج انتباهك الآن.",
};

// ── Section headings ───────────────────────────────────────────────────────────────────
export const DASHBOARD_SECTIONS = {
  actionQueue: "يحتاج انتباهك",
  kpis: "المؤشرات الرئيسية",
  leadsStatus: "حالة العملاء المحتملين",
  designerBoard: "لوحة الإنتاج",
  charts: "تحليلات الأداء",
  monthlyPerformance: "الأداء الشهري",
  weekPerformance: "أداء الأسبوع",
  emiratesAnalytics: "تحليلات الإمارات",
  leadsMonthlyOverview: "نظرة شهرية على العملاء",
};

// ── Filter bar copy ────────────────────────────────────────────────────────────────────
export const FILTER_COPY = {
  startDate: "من تاريخ",
  endDate: "إلى تاريخ",
  staffId: "معرّف الموظف (الإدارة فقط)",
  staffHelper: "اتركه فارغاً لعرض الكل",
  apply: "تطبيق",
  reset: "إعادة الضبط",
};

// ── Action-queue copy (each queue source deep-links to its next action) ────────────────
export const QUEUE_COPY = {
  // latest-leads pool — newest unassigned NEW leads waiting for first contact.
  latestLeads: {
    groupTitle: "عملاء جدد بانتظار التواصل",
    actionLabel: "تواصل الآن",
    emptyHint: "لا يوجد عملاء جدد بانتظار التواصل.",
  },
  // recent-activities feed — the caller's latest notifications, each linking to its source.
  recentActivities: {
    groupTitle: "آخر الأنشطة",
    actionLabel: "عرض",
    emptyHint: "لا توجد أنشطة حديثة.",
  },
};

// ── KPI cards — metadata over getKeyMetrics(). `field` maps to the envelope key; `format`
//    selects the value formatter; `accent` is a semantic hint (neutral|positive|warning). ──
export const KPI_CARDS = [
  { key: "totalRevenue", label: "إجمالي الإيرادات", field: "totalRevenue", format: "currency", accent: "positive" },
  { key: "averageProjectValue", label: "متوسط قيمة المشروع", field: "averageProjectValue", format: "currency", accent: "neutral" },
  { key: "successRate", label: "نسبة النجاح", field: "successRate", format: "percent", accent: "positive" },
  { key: "leadsCounts", label: "إجمالي العملاء", field: "leadsCounts", format: "number", accent: "neutral" },
  { key: "interactedLeads", label: "تفاعلات اليوم", field: "interactedLeads", format: "number", accent: "neutral" },
  { key: "newLeadCounts", label: "عملاء جدد", field: "newLeadCounts", format: "number", accent: "warning" },
  { key: "totalCommission", label: "إجمالي العمولات", field: "totalCommission", format: "currency", accent: "neutral" },
  { key: "successLeadsCount", label: "صفقات ناجحة", field: "successLeadsCount", format: "number", accent: "positive" },
];

// ── Designer / production board — metadata over getDesignerMetrics(). ──────────────────
export const DESIGNER_CARDS = [
  { key: "notStartedProject", label: "لم تبدأ", field: "notStartedProject", domain: "task", status: "TODO" },
  { key: "inProgressProject", label: "قيد التنفيذ", field: "inProgressProject", domain: "task", status: "IN_PROGRESS" },
  { key: "holdProjects", label: "معلّقة", field: "holdProjects", domain: "task", status: "CANCELLED" },
  { key: "completedProjects", label: "مكتملة", field: "completedProjects", domain: "task", status: "DONE" },
];

export const DESIGNER_META = [
  { key: "totalProjects", label: "إجمالي المشاريع", field: "totalProjects", format: "number" },
  { key: "totalArea", label: "إجمالي المساحة", field: "totalArea", format: "area" },
  { key: "currentMonthArea", label: "مساحة هذا الشهر", field: "currentMonthArea", format: "area" },
  { key: "totalTimeSpent", label: "ساعات العمل", field: "totalTimeSpent", format: "hours" },
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
